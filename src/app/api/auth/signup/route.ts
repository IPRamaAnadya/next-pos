import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, tenantName, tenantAddress, tenantPhone } = await req.json();

    // Validasi sederhana
    if (!email || !password || !tenantName) {
      return NextResponse.json(
        { error: 'Email, password, and tenant name are required' },
        { status: 400 }
      );
    }

    // Cek apakah user sudah ada
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Transaksi untuk membuat user, tenant, setting, staff
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat User
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });

      // 2. Buat Tenant
      const tenant = await tx.tenant.create({
        data: {
          userId: user.id,
          name: tenantName,
          email,
          address: tenantAddress,
          phone: tenantPhone,
        },
      });

      // 3. Buat Tenant Setting (default)
      await tx.tenantSetting.create({
        data: {
          tenantId: tenant.id,
          showDiscount: false,
          showTax: false,
        },
      });

      // 4. Buat Staff dengan role manager + isOwner
      const staff = await tx.staff.create({
        data: {
          tenantId: tenant.id,
          isOwner: true,
          role: 'manager',
          username: email,
          password: hashedPassword,
        },
      });

      return { user, tenant, staff };
    });

    return NextResponse.json(
      {
        meta: {
          code: 200,
          status: 'success',
          message: 'Signup successful',
        },
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error during signup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
