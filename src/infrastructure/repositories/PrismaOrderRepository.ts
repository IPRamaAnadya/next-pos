import prisma from '@/lib/prisma';
import { 
  Order, 
  CreateOrderData, 
  UpdateOrderData, 
  OrderQueryOptions, 
  PaginatedOrders,
  OrderItem 
} from '../../domain/entities/Order';
import { OrderRepository } from '../../domain/repositories/OrderRepository';

export class PrismaOrderRepository implements OrderRepository {
  private static instance: PrismaOrderRepository;

  // Field mapping from API field names to Prisma field names
  private readonly fieldMapping: Record<string, string> = {
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
    'order_no': 'orderNo',
    'grand_total': 'grandTotal',
    'total_amount': 'totalAmount',
    'paid_amount': 'paidAmount',
    'remaining_balance': 'remainingBalance',
    'tax_amount': 'taxAmount',
    'payment_method': 'paymentMethod',
    'payment_status': 'paymentStatus',
    'order_status': 'orderStatus',
    'payment_date': 'paymentDate',
    'customer_id': 'customerId',
    'customer_name': 'customerName',
    'discount_id': 'discountId',
    'discount_name': 'discountName',
    'discount_type': 'discountType',
    'discount_value': 'discountValue',
    'discount_amount': 'discountAmount',
    'discount_reward_type': 'discountRewardType',
    'point_used': 'pointUsed',
    'staff_id': 'staffId',
    'last_points_accumulation': 'lastPointsAccumulation',
    'tenant_id': 'tenantId'
  };

  // Valid sortable fields for security
  private readonly validSortFields = new Set([
    'id', 'createdAt', 'updatedAt', 'orderNo', 'grandTotal', 'subtotal',
    'totalAmount', 'paidAmount', 'paymentStatus', 'orderStatus', 'paymentDate',
    'customerName', 'customerId'
  ]);

  // Singleton to prevent memory leaks
  public static getInstance(): PrismaOrderRepository {
    if (!PrismaOrderRepository.instance) {
      PrismaOrderRepository.instance = new PrismaOrderRepository();
    }
    return PrismaOrderRepository.instance;
  }

  private constructor() {}
  
  generateOrderNumber(): string {
    // Using the same compact encoder from the original implementation
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const num = Date.now();
    let n = num;
    let out = '';
    while (n > 0) {
      const rem = n % 36;
      out = chars[rem] + out;
      n = Math.floor(n / 36);
    }
    return `0${out}`;
  }

  private mapSortField(apiFieldName: string): string {
    // First check if it's already a valid Prisma field name
    if (this.validSortFields.has(apiFieldName)) {
      return apiFieldName;
    }
    
    // Then check if we have a mapping from API field name to Prisma field name
    const mappedField = this.fieldMapping[apiFieldName];
    if (mappedField && this.validSortFields.has(mappedField)) {
      return mappedField;
    }
    
    // Default to createdAt for invalid field names
    console.warn(`Invalid sort field: ${apiFieldName}, defaulting to createdAt`);
    return 'createdAt';
  }

  async findById(id: string, tenantId: string): Promise<Order | null> {
    try {
      const order = await prisma.order.findUnique({
        where: { id, tenantId },
        include: { items: true },
      });

      if (!order) return null;

      return this.mapToEntity(order);
    } catch (error) {
      console.error('Error finding order by ID:', error);
      throw new Error(`Failed to find order with ID: ${id}`);
    }
  }

  async findAll(tenantId: string, options: OrderQueryOptions): Promise<PaginatedOrders> {
    try {
      const { limit, page, sortBy, sortDir, filters } = options;
      
      const whereClause: any = { tenantId };
      
      // Search across customerName and customerId
      if (filters?.search) {
        whereClause.OR = [
          { customerName: { contains: filters.search, mode: 'insensitive' } },
          { customerId: filters.search },
        ];
      }
      
      if (filters?.orderStatus) {
        whereClause.orderStatus = { equals: filters.orderStatus, mode: 'insensitive' };
      }
      if (filters?.paymentStatus) {
        whereClause.paymentStatus = { equals: filters.paymentStatus, mode: 'insensitive' };
      }
      if (filters?.customerId) whereClause.customerId = filters.customerId;
      if (filters?.customerName) {
        whereClause.customerName = { contains: filters.customerName, mode: 'insensitive' };
      }

      const totalCount = await prisma.order.count({ where: whereClause });
      const totalPages = Math.ceil(totalCount / limit);
      
      // Map the sort field to the correct Prisma field name
      const mappedSortField = this.mapSortField(sortBy);
      
      const orders = await prisma.order.findMany({
        where: whereClause,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { [mappedSortField]: sortDir },
        select: {
        id: true,
        orderNo: true,
        grandTotal: true,
        customerName: true,
        createdAt: true,
        orderStatus: true,
        paymentStatus: true,
        tenantId: true,
        subtotal: true,
        totalAmount: true,
        paidAmount: true,
        remainingBalance: true,
        change: true,
        taxAmount: true,
        paymentMethod: true,
        paymentDate: true,
        note: true,
        updatedAt: true,
        customerId: true,
        discountId: true,
        discountName: true,
        discountType: true,
        discountValue: true,
        discountAmount: true,
        discountRewardType: true,
        pointUsed: true,
        staffId: true,
        lastPointsAccumulation: true,
      },
    });

    const mappedOrders: Order[] = orders.map(order => ({
      ...order,
      tenantId: order.tenantId!,
      grandTotal: Number(order.grandTotal),
      subtotal: Number(order.subtotal),
      totalAmount: Number(order.totalAmount),
      paidAmount: Number(order.paidAmount),
      remainingBalance: order.remainingBalance ? Number(order.remainingBalance) : undefined,
      change: order.change ? Number(order.change) : undefined,
      taxAmount: order.taxAmount ? Number(order.taxAmount) : undefined,
      paymentMethod: order.paymentMethod || undefined,
      paymentDate: order.paymentDate || undefined,
      discountValue: order.discountValue ? Number(order.discountValue) : undefined,
      discountAmount: order.discountAmount ? Number(order.discountAmount) : undefined,
      paymentStatus: order.paymentStatus as 'unpaid' | 'paid' | 'partial',
      discountType: order.discountType as 'percentage' | 'fixed' | 'point' | undefined,
      discountRewardType: order.discountRewardType as 'cash' | 'point' | undefined,
      note: order.note || undefined,
      createdAt: order.createdAt || undefined,
      updatedAt: order.updatedAt || undefined,
      customerId: order.customerId || undefined,
      customerName: order.customerName || undefined,
      discountId: order.discountId || undefined,
      discountName: order.discountName || undefined,
      pointUsed: order.pointUsed || undefined,
      lastPointsAccumulation: order.lastPointsAccumulation || undefined,
      staffId: order.staffId!,
      orderStatus: order.orderStatus!,
      items: [] // Items not loaded for list operations
    }));

      const pagination = {
        totalData: totalCount,
        perPage: limit,
        currentPage: page,
        totalPage: totalPages,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      };

      return { orders: mappedOrders, pagination };
    } catch (error) {
      console.error('Error finding orders:', error);
      throw new Error(`Failed to retrieve orders for tenant: ${tenantId}`);
    }
  }

  async create(data: CreateOrderData, tenantId: string): Promise<Order> {
    const orderNo = this.generateOrderNumber();
    const paymentDate = data.paymentStatus === 'paid' ? new Date() : null;
    
    const { orderItems, ...orderData } = data;

    // Use nested connect for relations to avoid passing scalar foreign keys directly
    const { customerId, discountId, staffId, ...restOrderData } = orderData as any;

    console.log('Creating order with data:', data);

    const result = await prisma.$transaction(async (prisma) => {
      const createData: any = {
        ...restOrderData,
        orderNo,
        paymentDate,
        remainingBalance: Math.max(orderData.grandTotal - orderData.paidAmount, 0),
        change: Math.max(orderData.paidAmount - orderData.grandTotal, 0),
      };

      // Use nested connect for all relations
      createData.tenant = { connect: { id: tenantId } }; 
      if (customerId) createData.customer = { connect: { id: customerId } };
      if (discountId) createData.discount = { connect: { id: discountId } };
      if (staffId) createData.staff = { connect: { id: staffId } };

      const createdOrder = await prisma.order.create({ data: createData });

      await prisma.orderItem.createMany({
        data: orderItems.map((item) => ({
          tenantId,
          orderId: createdOrder.id,
          productName: item.productName,
          productId: item.productId,
          productPrice: item.productPrice,
          qty: item.qty,
        })),
      });

      // Update customer points accumulation if paid
      if (data.paymentStatus === 'paid' && data.customerId) {
        const customer = await prisma.customer.findUnique({ 
          where: { id: data.customerId } 
        });
        
        await prisma.order.update({
          where: { id: createdOrder.id },
          data: { lastPointsAccumulation: customer?.points },
        });
      }

      return await prisma.order.findUnique({
        where: { id: createdOrder.id },
        include: { items: true },
      });
    });

    return this.mapToEntity(result!);
  }

  async update(id: string, data: UpdateOrderData, tenantId: string): Promise<Order> {
    const { orderItems, ...orderData } = data;

    const result = await prisma.$transaction(async (prisma) => {
      // Check if payment date should be set
      const previousOrder = await prisma.order.findUnique({ where: { id } });
      const updateData: any = { ...orderData };

      if (previousOrder?.paymentDate == null && orderData.paymentStatus === 'paid') {
        updateData.paymentDate = new Date();
      }

      // Extract relation ids to use nested connect/disconnect
      const { customerId, discountId, staffId, ...restUpdateData } = updateData as any;

      // Delete existing order items and create new ones
      await prisma.orderItem.deleteMany({ where: { orderId: id } });
      await prisma.orderItem.createMany({
        data: orderItems.map((item) => ({
          tenantId,
          orderId: id,
          productName: item.productName,
          productId: item.productId,
          productPrice: item.productPrice,
          qty: item.qty,
        })),
      });

      // Update order
      const dataToApply: any = {
        ...restUpdateData,
        remainingBalance: Math.max(orderData.grandTotal - orderData.paidAmount, 0),
        change: Math.max(orderData.paidAmount - orderData.grandTotal, 0),
      };

      if (customerId !== undefined) {
        dataToApply.customer = customerId ? { connect: { id: customerId } } : { disconnect: true };
      }
      if (discountId !== undefined) {
        dataToApply.discount = discountId ? { connect: { id: discountId } } : { disconnect: true };
      }
      if (staffId !== undefined) {
        dataToApply.staff = staffId ? { connect: { id: staffId } } : { disconnect: true };
      }

      const updatedOrder = await prisma.order.update({
        where: { id, tenantId },
        data: dataToApply,
      });

      // Update customer points accumulation if paid
      if (orderData.paymentStatus === 'paid' && orderData.customerId) {
        const customer = await prisma.customer.findUnique({ 
          where: { id: orderData.customerId } 
        });
        
        await prisma.order.update({
          where: { id },
          data: { lastPointsAccumulation: customer?.points },
        });
      }

      return await prisma.order.findUnique({
        where: { id },
        include: { items: true },
      });
    });

    return this.mapToEntity(result!);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.$transaction(async (prisma) => {
      await prisma.orderItem.deleteMany({ where: { orderId: id } });
      await prisma.order.delete({ where: { id, tenantId } });
    });
  }

  private mapToEntity(order: any): Order {
    const items: OrderItem[] = order.items?.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productPrice: Number(item.productPrice),
      qty: Number(item.qty),
      totalPrice: Math.round(Number(item.productPrice) * Number(item.qty)),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })) || [];

    return {
      id: order.id,
      tenantId: order.tenantId,
      orderNo: order.orderNo,
      grandTotal: Number(order.grandTotal),
      subtotal: Number(order.subtotal),
      totalAmount: Number(order.totalAmount),
      paidAmount: Number(order.paidAmount),
      remainingBalance: order.remainingBalance ? Number(order.remainingBalance) : undefined,
      change: order.change ? Number(order.change) : undefined,
      taxAmount: order.taxAmount ? Number(order.taxAmount) : undefined,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus as 'unpaid' | 'paid' | 'partial',
      orderStatus: order.orderStatus,
      paymentDate: order.paymentDate,
      note: order.note,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customerId: order.customerId,
      customerName: order.customerName,
      discountId: order.discountId,
      discountName: order.discountName,
      discountType: order.discountType as 'percentage' | 'fixed' | 'point' | undefined,
      discountValue: order.discountValue ? Number(order.discountValue) : undefined,
      discountAmount: order.discountAmount ? Number(order.discountAmount) : undefined,
      discountRewardType: order.discountRewardType as 'cash' | 'point' | undefined,
      pointUsed: order.pointUsed,
      staffId: order.staffId,
      lastPointsAccumulation: order.lastPointsAccumulation,
      items,
    };
  }

  // Clean up method for testing
  public static cleanup(): void {
    if (PrismaOrderRepository.instance) {
      PrismaOrderRepository.instance = null as any;
    }
  }
}