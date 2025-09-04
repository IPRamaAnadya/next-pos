import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/app/api/utils/jwt';
import { productCreateSchema } from '@/utils/validation/productSchema';

export async function GET(req: Request, { params }: { params: { tenantId: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const tenantIdFromUrl = (await params).tenantId;
    if (tenantIdFromToken !== tenantIdFromUrl) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const p_limit = parseInt(searchParams.get('p_limit') || '5', 10);
    const p_page = parseInt(searchParams.get('p_page') || '1', 10);
    const p_search_name = searchParams.get('p_search_name');
    const p_category_id = searchParams.get('p_category_id');
    const p_sort_by = searchParams.get('p_sort_by') || 'name';
    const p_sort_dir = searchParams.get('p_sort_dir') || 'asc';
    const whereClause: any = { tenantId: tenantIdFromUrl };
    if (p_search_name) {
      whereClause.name = { contains: p_search_name, mode: 'insensitive' };
    }
    if (p_category_id) {
      whereClause.productCategoryId = p_category_id;
    }
    const totalCount = await prisma.product.count({ where: whereClause });
    const totalPages = Math.ceil(totalCount / p_limit);
    const products = await prisma.product.findMany({
      where: whereClause, take: p_limit, skip: (p_page - 1) * p_limit, orderBy: { [p_sort_by]: p_sort_dir },
    });
    const pagination = {
      total_data: totalCount, per_page: p_limit, current_page: p_page, total_page: totalPages, next_page: p_page < totalPages ? p_page + 1 : null, prev_page: p_page > 1 ? p_page - 1 : null,
    };
    return NextResponse.json({
      meta: { code: 200, status: 'success', message: 'Products data retrieved successfully' },
      data: { products, pagination },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { tenantId: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const tenantIdFromUrl = (await params).tenantId;
    if (tenantIdFromToken !== tenantIdFromUrl) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }
    const data = await req.json();
    
    try {
      await productCreateSchema.validate(data, { abortEarly: false });
    } catch (validationError: any) {
      return NextResponse.json({ error: 'Validation failed', details: validationError.errors }, { status: 400 });
    }
    const newProduct = await prisma.product.create({ data: { ...data, tenantId: tenantIdFromUrl } });
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}