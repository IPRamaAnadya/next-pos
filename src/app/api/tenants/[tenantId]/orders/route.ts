/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/app/api/utils/jwt';
import { orderCreateSchema } from '@/utils/validation/orderSchema';
import { enforceLimit } from '@/lib/subscriptionLimit';

// compact encoder for positive integers using digits + UPPERCASE (radix 36)
// used for compact order numbers (digits + uppercase letters only)
function encodeBase62(num: number) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (num <= 0) return '0';
  let n = num;
  let out = '';
  while (n > 0) {
    const rem = n % 36;
    out = chars[rem] + out;
    n = Math.floor(n / 36);
  }
  return out;
}

// GET: Get list of orders
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
    const p_order_status = searchParams.get('p_order_status');
    const p_payment_status = searchParams.get('p_payment_status');
    const p_customer_name = searchParams.get('p_customer_name');
    const p_customer_id = searchParams.get('p_customer_id');
    const p_sort_by = searchParams.get('p_sort_by') || 'created_at';
    const p_sort_dir = searchParams.get('p_sort_dir') || 'desc';

    const whereClause: any = { tenantId: tenantIdFromUrl };

    if (p_order_status) whereClause.orderStatus = p_order_status;
    if (p_payment_status) whereClause.paymentStatus = p_payment_status;
    if (p_customer_id) whereClause.customerId = p_customer_id;
    if (p_customer_name) {
      whereClause.customerName = { contains: p_customer_name, mode: 'insensitive' };
    }

    const totalCount = await prisma.order.count({ where: whereClause });
    const totalPages = Math.ceil(totalCount / p_limit);
    const orders = await prisma.order.findMany({
      where: whereClause,
      take: p_limit,
      select: {
        id: true,
        orderNo: true,
        grandTotal: true,
        customerName: true,
        createdAt: true,
        orderStatus: true,
        paymentStatus: true,
      },
      skip: (p_page - 1) * p_limit,
      orderBy: { [p_sort_by]: p_sort_dir },
    });

    const pagination = {
      total_data: totalCount,
      per_page: p_limit,
      current_page: p_page,
      total_page: totalPages,
      next_page: p_page < totalPages ? p_page + 1 : null,
      prev_page: p_page > 1 ? p_page - 1 : null,
    };

    const jsonResponse = {
      meta: { code: 200, status: 'success', message: 'Orders data retrieved successfully' },
      data: { orders, pagination },
    }

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new order
export async function POST(req: Request, { params }: { params: { tenantId: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const tenantIdFromUrl = (await params).tenantId;

    if (tenantIdFromToken !== tenantIdFromUrl) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }

    const body = await req.json();

    try {
      await orderCreateSchema.validate(body, { abortEarly: false });
    } catch (validationError: any) {
      return NextResponse.json({ error: 'Validation failed', details: validationError.errors }, { status: 400 });
    }

    // PaymentDate
    const paymentDate = body.paymentStatus == 'paid' ? new Date() : null;

    const { orderItems, ...orderData } = body;
    const orderNo = `0${encodeBase62(Date.now())}`;

    // enforce transaction limit (counting this new order as increment)
    try {
      await enforceLimit(tenantIdFromUrl, 'transaction', 1);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }

    const newOrder = await prisma.$transaction(async (prisma) => {
      const createdOrder = await prisma.order.create({
        data: {
          ...orderData,
          orderNo,
          paymentDate,
          tenantId: tenantIdFromUrl,
          remainingBalance: Math.max(orderData.grandTotal - orderData.paidAmount, 0),
          change: Math.max(orderData.paidAmount - orderData.grandTotal, 0),
        },
        include: {
          items: true,
        },
      });

      // Insert order items
      await prisma.orderItem.createMany({
        data: orderItems.map((item: any) => ({
          tenantId: tenantIdFromUrl,
          orderId: createdOrder.id,
          productName: item.productName,
          productId: item.productId,
          productPrice: item.productPrice,
          qty: item.qty,
        })),
      });

      // Handle customer points logic
      if (orderData.paymentStatus === 'paid' && orderData.customerId) {
        if (orderData.pointUsed && orderData.pointUsed > 0) {
          await prisma.customer.update({
            where: { id: orderData.customerId },
            data: { points: { decrement: orderData.pointUsed } },
          });
        }
        if (orderData.discountRewardType === 'point' && orderData.discountAmount && orderData.discountAmount > 0) {
          await prisma.customer.update({
            where: { id: orderData.customerId },
            data: { points: { increment: orderData.discountAmount } },
          });
        }
        const updatedCustomer = await prisma.customer.findUnique({ where: { id: orderData.customerId } });
        await prisma.order.update({
          where: { id: createdOrder.id },
          data: { lastPointsAccumulation: updatedCustomer?.points },
        });
      }

      // finalize order creation
      const ord = await prisma.order.findUnique({
        where: { id: createdOrder.id },
        include: { items: true },
      });



      // Send notification after order creation
      if (ord) {
        try {
          // add totalPrice to each item
          // e.g. Math.round(item.productPrice * item.qty),
          ord.items = ord.items.map(item => {
            return {
              ...item,
              totalPrice: Math.round(Number(item.productPrice) * Number(item.qty)),
            };
          });

          const customer = await prisma.customer.findUnique({ where: { id: ord.customerId ?? '' } });

          const notificationVars = {
            phone: customer?.phone || '',
            customerName: customer?.name || '',
            grandTotal: `Rp${Number(ord.grandTotal).toLocaleString('id-ID')}`,
          };
          if (ord.paymentStatus === 'paid') {
            await import('@/lib/orderNotificationService').then(({ sendOrderNotification }) =>
              sendOrderNotification({
                tenantId: tenantIdFromUrl,
                event: 'ORDER_PAID',
                orderId: ord.id,
                variables: notificationVars
              })
            );
          } else {
            await import('@/lib/orderNotificationService').then(({ sendOrderNotification }) =>
              sendOrderNotification({
                tenantId: tenantIdFromUrl,
                event: 'ORDER_CREATED',
                orderId: ord.id,
                variables: notificationVars
              })
            );
          }
        } catch (notifyError) {
          // Log notification error but don't throw - order creation should succeed even if notification fails
          console.error('Failed to send order notification, but order was created successfully:', {
            orderId: ord.id,
            tenantId: tenantIdFromUrl,
            error: notifyError instanceof Error ? notifyError.message : String(notifyError)
          });
        }
      }
      return ord;
    });

    const jsonResponse = {
      'data': {
        'order': newOrder
      }
    }

    return NextResponse.json(jsonResponse, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}