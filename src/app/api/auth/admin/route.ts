import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { generateToken } from '@/app/api/utils/jwt';

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json(); // identifier can be username or email

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const admin = await prisma.admin.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
        isActive: true,
      },
    });

    // If no admin found, but the admin table is empty, bootstrap a SUPERADMIN
    if (!admin) {
      const totalAdmins = await prisma.admin.count();
      if (totalAdmins === 0) {
        // derive username and email
        let username = identifier;
        let email = identifier;
        if (!identifier.includes('@')) {
          // create a fallback email for the initial admin
          email = `${identifier}@example.com`;
        } else {
          username = identifier.split('@')[0];
        }

        const hashed = await bcrypt.hash(password, 10);
        const created = await prisma.admin.create({
          data: {
            username,
            email,
            password: hashed,
            role: 'SUPERADMIN',
            isActive: true,
            lastLoginAt: new Date(),
          },
        });

        const payload = {
          adminId: created.id,
          role: created.role,
          username: created.username,
          email: created.email,
        };
        const token = generateToken(payload);
        return NextResponse.json({ token, admin: { id: created.id, username: created.username, email: created.email, role: created.role } });
      }

      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!bcrypt.compareSync(password, admin.password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const payload = {
      adminId: admin.id,
      role: admin.role,
      username: admin.username,
      email: admin.email,
    };

    const token = generateToken(payload);

    // update lastLoginAt
    await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

    return NextResponse.json({ token, admin: { id: admin.id, username: admin.username, email: admin.email, role: admin.role } });
  } catch (error) {
    console.error('Admin login error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
