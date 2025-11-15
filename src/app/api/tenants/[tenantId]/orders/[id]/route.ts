/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/app/api/utils/jwt';
import { orderUpdateSchema } from '@/utils/validation/orderSchema';

// GET: Get order details (replacing get_order_detail)
export async function GET(req: Request, { params }: { params: { tenantId: string, id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const { tenantId, id } = await params;

    if (tenantIdFromToken !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }

    const order = await prisma.order.findUnique({
      where: { id, tenantId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderWithTotal = {
      ...order,
      items: order?.items.map((item: any) => ({
        ...item,
        totalPrice: Math.round(item.productPrice * item.qty),
      })),
    };

    const jsonResponse = {
      data: {
        order: orderWithTotal
      }
    }

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update an order (replacing update_order)
export async function PUT(req: Request, { params }: { params: { tenantId: string, id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const { tenantId, id } = await params;

    if (tenantIdFromToken !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }

    const body = await req.json();

    try {
      await orderUpdateSchema.validate(body, { abortEarly: false });
    } catch (validationError: any) {
      return NextResponse.json({ error: 'Validation failed', details: validationError.errors }, { status: 400 });
    }

    const { orderItems, ...orderData } = body;

    const updatedOrder = await prisma.$transaction(async (prisma) => {
      // Delete existing order items and create new ones
      await prisma.orderItem.deleteMany({ where: { orderId: id } });
      await prisma.orderItem.createMany({
        data: orderItems.map((item: any) => ({
          tenantId,
          orderId: id,
          productName: item.productName,
          productId: item.productId,
          productPrice: item.productPrice,
          qty: item.qty,
        })),
      });

      const previousOrder = await prisma.order.findUnique({
        where: {
          id: tenantId
        }
      });

      if (previousOrder?.paymentDate == null && orderData.paymentStatus == 'paid') {
        orderData.paymentDate = new Date();
      }

      // Update order
      const updatedOrder = await prisma.order.update({
        where: { id, tenantId },
        data: {
          ...orderData,
          remainingBalance: Math.max(orderData.grandTotal - orderData.paidAmount, 0),
          change: Math.max(orderData.paidAmount - orderData.grandTotal, 0),
        },
      });

      // Handle point logic similar to creation
      if (orderData.paymentStatus === 'paid' && orderData.customerId) {
        // Here you would need to implement logic to reverse previous point changes
        // This is complex and depends on the order history.
        // For simplicity, we are applying the changes directly.
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
          where: { id },
          data: { lastPointsAccumulation: updatedCustomer?.points },
        });
      }

      // Send notification after order update
      try {
        const customer = await prisma.customer.findUnique({ where: { id: orderData.customerId ?? '' } });

        const notificationVars = {
          phone: customer?.phone || '',
          customerName: customer?.name || '',
          grandTotal: `Rp${Number(orderData.grandTotal).toLocaleString('id-ID')}`,
        };
        if (updatedOrder.paymentStatus === 'paid') {
          await import('@/lib/orderNotificationService').then(({ sendOrderNotification }) =>
            sendOrderNotification({
              tenantId,
              event: 'ORDER_PAID',
              orderId: updatedOrder.id,
              variables: notificationVars
            })
          );
        } else {
          await import('@/lib/orderNotificationService').then(({ sendOrderNotification }) =>
            sendOrderNotification({
              tenantId,
              event: 'ORDER_CREATED',
              orderId: updatedOrder.id,
              variables: notificationVars
            })
          );
        }
      } catch (notifyError) {
        // Log notification error but don't throw - order update should succeed even if notification fails
        console.error('Failed to send order notification, but order was updated successfully:', {
          orderId: updatedOrder.id,
          tenantId,
          error: notifyError instanceof Error ? notifyError.message : String(notifyError)
        });
      }
      return updatedOrder;
    });

    // Fetch the updated order with items and totalPrice for each item
    const order = await prisma.order.findUnique({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ error: 'Order not found after update' }, { status: 404 });
    }
    const orderWithTotal = {
      ...order,
      items: order?.items.map((item: any) => ({
        ...item,
        totalPrice: Math.round(item.productPrice * item.qty),
      })),
    };
    const jsonResponse = {
      data: {
        order: orderWithTotal
      }
    };
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete an order
export async function DELETE(req: Request, { params }: { params: { tenantId: string, id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    const tenantIdFromToken = decoded.tenantId;
    const { tenantId, id } = params;

    if (tenantIdFromToken !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 });
    }

    const orderToDelete = await prisma.order.findUnique({ where: { id, tenantId } });

    if (!orderToDelete) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if order is 'completed'
    if (orderToDelete.orderStatus === 'completed') {
      return NextResponse.json({ error: 'Order with completed status cannot be deleted.' }, { status: 403 });
    }

    await prisma.$transaction(async (prisma) => {
      // Reverse point changes if necessary before deleting
      if (orderToDelete.paymentStatus === 'paid' && orderToDelete.customerId) {
        if (orderToDelete.pointUsed && orderToDelete.pointUsed > 0) {
          await prisma.customer.update({
            where: { id: orderToDelete.customerId },
            data: { points: { increment: orderToDelete.pointUsed } },
          });
        }
        if (orderToDelete.discountRewardType === 'point' && orderToDelete.discountAmount && orderToDelete.discountAmount.toNumber() > 0) {
          await prisma.customer.update({
            where: { id: orderToDelete.customerId },
            data: { points: { decrement: orderToDelete.discountAmount.toNumber() } },
          });
        }
      }
      await prisma.orderItem.deleteMany({ where: { orderId: id } });
      await prisma.order.delete({ where: { id, tenantId } });
    });

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}