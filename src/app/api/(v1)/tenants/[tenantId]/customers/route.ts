/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/app/api/utils/jwt';
import { customerCreateSchema } from '@/utils/validation/customerSchema';
import { validateTenantAuth } from '@/lib/auth';

type Params = Promise<{ tenantId: string } >;


// GET: Mengambil daftar customer dengan pencarian dan paginasi
export async function GET(req: Request, { params }: { params: Params }) {
  try {
    const authResult = validateTenantAuth(req as any, (await params).tenantId);
    if (!authResult.success) {
      return authResult.response;
    }

    const tenantId = authResult.tenantId;

    const { searchParams } = new URL(req.url);
    const p_limit = parseInt(searchParams.get('p_limit') || '5', 10);
    const p_page = parseInt(searchParams.get('p_page') || '1', 10);
    const p_search = searchParams.get('p_search');

    const whereClause: any = {
      tenantId: tenantId,
    };

    if (p_search) {
      whereClause.OR = [
        { name: { contains: p_search, mode: 'insensitive' } },
        { phone: { contains: p_search, mode: 'insensitive' } }
      ];
    }

    const totalCount = await prisma.customer.count({ where: whereClause });
    const totalPages = Math.ceil(totalCount / p_limit);
    const customers = await prisma.customer.findMany({
      where: whereClause,
      take: p_limit,
      skip: (p_page - 1) * p_limit,
      orderBy: { name: 'asc' },
    });

    const pagination = {
      total_data: totalCount,
      per_page: p_limit,
      current_page: p_page,
      total_page: totalPages,
      next_page: p_page < totalPages ? p_page + 1 : null,
      prev_page: p_page > 1 ? p_page - 1 : null,
    };

    return NextResponse.json({
      meta: { code: 200, status: 'success', message: 'Customers data retrieved successfully' },
      data: { customers, pagination },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Membuat customer baru
export async function POST(req: Request, { params }: { params: Params }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const tenantIdFromUrl = (await params).tenantId;

    if (tenantIdFromToken !== tenantIdFromUrl) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }

    const data = await req.json();

    // remove empty fields
    Object.keys(data).forEach((key) => {
      if (data[key] === '') {
        delete data[key];
      }
    });

    try {
      await customerCreateSchema.validate(data, { abortEarly: false });
    } catch (validationError: any) {
      return NextResponse.json({ error: 'Validation failed', details: validationError.errors }, { status: 400 });
    }

    const newCustomer = await prisma.customer.create({
      data: { ...data, tenantId: tenantIdFromUrl },
    });

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}