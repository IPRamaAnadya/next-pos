import { NextRequest } from "next/server";
import { apiResponse } from "@/app/api/utils/response";
import { verifyToken } from "@/app/api/utils/jwt";
import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient();

/**
 * GET /api/v2/admin/dashboard/statistics
 * Get overall dashboard statistics for admin
 */
export async function GET(req: NextRequest) {
  try {
    // Verify admin token
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return apiResponse.unauthorized("Token is required");
    }

    const decoded: any = verifyToken(token);
    
    // Check if user has admin role (SUPERADMIN, ADMIN, or STAFF)
    const validAdminRoles = ['SUPERADMIN', 'ADMIN', 'STAFF', 'admin'];
    if (!decoded.role || !validAdminRoles.includes(decoded.role)) {
      return apiResponse.forbidden("Admin access required");
    }

    // Calculate date range for trends (last 7 days)
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Get statistics in parallel
    const [
      totalTenants,
      totalUsers,
      totalDonations,
      donationStats,
      recentTenants,
      recentDonations,
      donationTrend,
      userGrowth
    ] = await Promise.all([
      // Total tenants count
      prisma.tenant.count(),

      // Total users count
      prisma.user.count(),

      // Total donations count
      prisma.tenantDonation.count(),

      // Donation amount statistics
      prisma.tenantDonation.aggregate({
        where: {
          status: "PAID",
        },
        _sum: {
          amount: true,
          netAmount: true,
        },
      }),

      // Recent 5 tenants
      prisma.tenant.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          isSubscribed: true,
        },
      }),

      // Recent 5 donations
      prisma.tenantDonation.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          tenant: {
            select: {
              name: true,
            },
          },
          paymentMethod: {
            select: {
              name: true,
            },
          },
        },
      }),

      // Donation trend (last 7 days)
      prisma.tenantDonation.findMany({
        where: {
          status: "PAID",
          createdAt: {
            gte: sevenDaysAgo,
            lte: today,
          },
        },
        select: {
          amount: true,
          createdAt: true,
        },
      }),

      // User growth (last 7 days)
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
            lte: today,
          },
        },
        select: {
          createdAt: true,
        },
      }),
    ]);

    // Process donation trend data
    const donationTrendByDay = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayDonations = donationTrend.filter(d => {
        const donationDate = new Date(d.createdAt).toISOString().split('T')[0];
        return donationDate === dateStr;
      });
      
      const totalAmount = dayDonations.reduce((sum, d) => sum + d.amount.toNumber(), 0);
      
      return {
        date: dateStr,
        label: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
        amount: totalAmount,
        count: dayDonations.length,
      };
    });

    // Process user growth data
    const userGrowthByDay = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayUsers = userGrowth.filter(u => {
        const userDate = new Date(u.createdAt).toISOString().split('T')[0];
        return userDate === dateStr;
      });
      
      return {
        date: dateStr,
        label: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
        count: dayUsers.length,
      };
    });

    return apiResponse.success({
      data: {
        statistics: {
          total_tenants: totalTenants,
          total_users: totalUsers,
          total_donations: totalDonations,
          total_donation_amount: donationStats._sum.amount?.toNumber() || 0,
          total_net_amount: donationStats._sum.netAmount?.toNumber() || 0,
        },
        recent_tenants: recentTenants.map((tenant) => ({
          id: tenant.id,
          name: tenant.name,
          email: tenant.email,
          is_subscribed: tenant.isSubscribed,
          created_at: tenant.createdAt,
        })),
        recent_donations: recentDonations.map((donation) => ({
          id: donation.id,
          tenant_name: donation.tenant.name,
          amount: donation.amount.toNumber(),
          net_amount: donation.netAmount.toNumber(),
          payment_method: donation.paymentMethod?.name || 'N/A',
          status: donation.status,
          created_at: donation.createdAt,
        })),
        donation_trend: donationTrendByDay,
        user_growth: userGrowthByDay,
      },
      message: "Dashboard statistics retrieved successfully",
    });
  } catch (error: any) {
    console.error("Dashboard statistics error:", error);
    return apiResponse.internalError();
  }
}
