/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/app/api/utils/jwt';
import { expenseCreateSchema } from '@/utils/validation/expenseSchema';

// GET: Mengambil daftar semua pengeluaran
export async function GET(req: Request, { params }: { params: { tenantId: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const tenantIdFromUrl = (await params).tenantId;
    // get isCashier from query param
    const isCashier = req.url.includes('isCashier=true');
    if (tenantIdFromToken !== tenantIdFromUrl) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }

    // Pagination
    const urlObj = new URL(req.url);
    const page = parseInt(urlObj.searchParams.get('p_page') || '1', 10);
    const limit = parseInt(urlObj.searchParams.get('p_limit') || '50', 50);
    const skip = (page - 1) * limit;

    var whereClause: any = { tenantId: tenantIdFromUrl };
    if (isCashier) {
      whereClause.isShow = false;
      whereClause.expenseCategory = { isPrivate: false };
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where: { ...whereClause },
        include: {
          expenseCategory: true,
          staff: {
            select: {
              id: true,
              username: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where: { ...whereClause } })
    ]);

    return NextResponse.json({
      data: expenses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Membuat pengeluaran baru
export async function POST(req: Request, { params }: { params: { tenantId: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const tenantIdFromUrl = (await params).tenantId;
    const isCashier = req.url.includes('isCashier=true');
    if (tenantIdFromToken !== tenantIdFromUrl) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }
    const data = await req.json();
    try {
      await expenseCreateSchema.validate(data, { abortEarly: false });
    } catch (validationError: any) {
      return NextResponse.json({ error: 'Validation failed', details: validationError.errors }, { status: 400 });
    }
    const newExpense = await prisma.expense.create({
      data: { ...data, tenantId: tenantIdFromUrl, isShow: isCashier ? true : false },
    });
    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}