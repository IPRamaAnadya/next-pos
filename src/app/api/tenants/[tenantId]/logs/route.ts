// app/api/data/tenants/[tenantId]/logs/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/app/api/utils/jwt';
import { logCreateSchema } from '@/utils/validation/logSchema';

export async function GET(req: Request, { params }: { params: { tenantId: string } }) {
  try {
    // 1. Verifikasi token dan kecocokan tenantId dari token dan URL
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const tenantIdFromUrl = params.tenantId;

    if (tenantIdFromToken !== tenantIdFromUrl) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }

    // 2. Ambil parameter query untuk paginasi, pencarian, dan sortasi
    const { searchParams } = new URL(req.url);
    const p_limit = parseInt(searchParams.get('p_limit') || '10', 10);
    const p_page = parseInt(searchParams.get('p_page') || '1', 10);
    const p_search = searchParams.get('p_search');
    const p_sort_by = searchParams.get('p_sort_by') || 'created_at';
    const p_sort_dir = searchParams.get('p_sort_dir') || 'desc';

    // 3. Bangun klausa WHERE secara dinamis
    const whereClause: any = { tenantId: tenantIdFromUrl };

    if (p_search) {
      whereClause.OR = [
        { action: { contains: p_search, mode: 'insensitive' } },
        { staff: { username: { contains: p_search, mode: 'insensitive' } } },
        // Anda bisa menambahkan pencarian di field 'data' (JSONB)
        // Contoh: { data: { path: ['orderNo'], string_contains: p_search } }
      ];
    }

    // 4. Lakukan query data dan hitung total data
    const totalCount = await prisma.log.count({ where: whereClause });
    const totalPages = Math.ceil(totalCount / p_limit);
    const logs = await prisma.log.findMany({
      where: whereClause,
      take: p_limit,
      skip: (p_page - 1) * p_limit,
      orderBy: { [p_sort_by]: p_sort_dir },
      include: {
        staff: {
          select: {
            id: true,
            username: true,
            role: true,
          }
        }
      }
    });

    // 5. Bangun respons dengan data dan metadata paginasi
    const pagination = {
      total_data: totalCount,
      per_page: p_limit,
      current_page: p_page,
      total_page: totalPages,
      next_page: p_page < totalPages ? p_page + 1 : null,
      prev_page: p_page > 1 ? p_page - 1 : null,
    };

    return NextResponse.json({
      meta: { code: 200, status: 'success', message: 'Logs data retrieved successfully' },
      data: { logs, pagination },
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Mencatat log baru
export async function POST(req: Request, { params }: { params: { tenantId: string } }) {
  try {
    // Verifikasi token dan kecocokan tenantId dari token dan URL
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const tenantIdFromUrl = params.tenantId;

    if (tenantIdFromToken !== tenantIdFromUrl) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }

    const body = await req.json();

    // Validasi data yang diterima
    try {
      await logCreateSchema.validate(body, { abortEarly: false });
    } catch (validationError: any) {
      return NextResponse.json({ error: 'Validation failed', details: validationError.errors }, { status: 400 });
    }

    // Buat entri log baru di database
    const newLog = await prisma.log.create({
      data: {
        tenantId: tenantIdFromUrl,
        staffId: body.staffId,
        action: body.action,
        data: body.data || {}, // Pastikan field JSONB tidak null
      },
    });

    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    console.error('Error creating log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}