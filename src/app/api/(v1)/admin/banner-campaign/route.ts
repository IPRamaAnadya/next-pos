import { NextResponse } from 'next/server';
import * as yup from 'yup';
import { uploadService } from '@/lib/uploader';
import prisma from '@/lib/prisma';

const bannerSchema = yup.object({
  name: yup.string().required('Nama banner wajib diisi'),
  description: yup.string().nullable(),
  image: yup.mixed().required('Gambar banner wajib diunggah'),
  isActive: yup.boolean().default(false),
  publishAt: yup.date().required('Tanggal publikasi wajib diisi'),
  publishUntil: yup.date().required('Tanggal akhir publikasi wajib diisi'),
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const data = Object.fromEntries(formData.entries());

    const validatedData = await bannerSchema.validate(data, { abortEarly: false });

    const file = formData.get('image') as File;
    const imageUrl = await uploadService.save(file, { folder: 'banner-campaigns' });

    const banner = await prisma.bannerCampaign.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        imageUrl,
        isActive: validatedData.isActive,
        publishAt: new Date(validatedData.publishAt),
        publishUntil: new Date(validatedData.publishUntil),
      },
    });

    return NextResponse.json({
      meta: { code: 201, status: 'success', message: 'Banner berhasil dibuat' },
      data: banner,
    });
  } catch (error: any) {
    console.error('Error creating banner:', error);
    return NextResponse.json({
      meta: { code: 400, status: 'error', message: error.message },
    }, { status: 400 });
  }
}

export async function GET() {
  try {
    const banners = await prisma.bannerCampaign.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      meta: { code: 200, status: 'success', message: 'Daftar banner berhasil diambil' },
      data: banners,
    });
  } catch (error: any) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({
      meta: { code: 500, status: 'error', message: 'Gagal mengambil daftar banner' },
    }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    const banner = await prisma.bannerCampaign.findUnique({ where: { id } });
    if (!banner) {
      return NextResponse.json({
        meta: { code: 404, status: 'error', message: 'Banner tidak ditemukan' },
      }, { status: 404 });
    }

    await uploadService.delete(banner.imageUrl);
    await prisma.bannerCampaign.delete({ where: { id } });

    return NextResponse.json({
      meta: { code: 200, status: 'success', message: 'Banner berhasil dihapus' },
    });
  } catch (error: any) {
    console.error('Error deleting banner:', error);
    return NextResponse.json({
      meta: { code: 500, status: 'error', message: 'Gagal menghapus banner' },
    }, { status: 500 });
  }
}