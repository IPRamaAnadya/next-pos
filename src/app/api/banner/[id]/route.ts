import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  if (id) {
    try {
      const banner = await prisma.bannerCampaign.findUnique({
        where: { id },
        select: { imageUrl: true },
      });

      if (!banner) {
        return NextResponse.json({
          meta: { code: 404, status: "error", message: "Banner tidak ditemukan" },
        }, { status: 404 });
      }

      return NextResponse.json({
        meta: { code: 200, status: "success", message: "Banner berhasil diambil" },
        data: banner,
      });
    } catch (error: any) {
      console.error("Error fetching banner:", error);
      return NextResponse.json({
        meta: { code: 500, status: "error", message: "Gagal mengambil banner" },
      }, { status: 500 });
    }
  } else {
    try {
      const banner = await prisma.bannerCampaign.findFirst({
        select: { imageUrl: true },
      });

      if (!banner) {
        return NextResponse.json({
          meta: { code: 404, status: "error", message: "Banner tidak ditemukan" },
        }, { status: 404 });
      }

      return NextResponse.json({
        meta: { code: 200, status: "success", message: "Banner berhasil diambil" },
        data: banner,
      });
    } catch (error: any) {
      console.error("Error fetching banner:", error);
      return NextResponse.json({
        meta: { code: 500, status: "error", message: "Gagal mengambil banner" },
      }, { status: 500 });
    }
  }
}