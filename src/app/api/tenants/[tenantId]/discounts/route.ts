/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/app/api/utils/jwt';
import { discountCreateSchema } from '@/utils/validation/discountSchema';
import { apiResponse, ErrorType } from '@/app/api/utils/response';

// GET: Mengambil daftar semua diskon
export async function GET(req: Request, { params }: { params: { tenantId: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const tenantIdFromUrl = (await params).tenantId;

    if (tenantIdFromToken !== tenantIdFromUrl) {
      return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
    }

    // Ambil role dari query param, default 'admin' jika tidak ada
    const url = new URL(req.url);
    const role = url.searchParams.get('role') || 'admin';
    let where: any = { tenantId: tenantIdFromUrl, rewardType: { in: ['cash', 'point'] } };
    if (role === 'cashier') {
      const now = new Date();
      where = {
        ...where,
        validFrom: { lte: now },
        validTo: { gte: now },
      };
    }
    const discounts = await prisma.discount.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        rewardType: true,
        validFrom: true,
        validTo: true,
        type: true,
        value: true,
        minPurchase: true,
        maxDiscount: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('Fetched discounts:', discounts);

    return NextResponse.json({
      data: {
        discounts: discounts
      }
    });
  } catch (error) {
    return apiResponse.internalError();
  }
}

// POST: Membuat diskon baru
export async function POST(req: Request, { params }: { params: { tenantId: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const tenantIdFromUrl = (await params).tenantId;

    console.log(tenantIdFromToken, tenantIdFromUrl);

    if (tenantIdFromToken !== tenantIdFromUrl) {
      return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
    }

    const data = await req.json();

    try {
      await discountCreateSchema.validate(data, { abortEarly: false });
    } catch (validationError: any) {
      console.log(validationError);
      return apiResponse.validationError(validationError.errors);
    }

    const newDiscount = await prisma.discount.create({
      data: { ...data, tenantId: tenantIdFromUrl, rewardType: 'cash' },
    });

    return NextResponse.json(newDiscount, { status: 201 });
  } catch (error) {
    console.log(error);
    return apiResponse.internalError();
  }
}