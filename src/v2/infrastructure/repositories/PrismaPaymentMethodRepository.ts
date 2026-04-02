/**
 * Infrastructure: Prisma Payment Method Repository Implementation
 * Implements payment method data access using Prisma ORM
 */

import prisma from "@/lib/prisma";
import { PaymentMethod } from "@/domain/entities/PaymentMethod";
import {
  PaymentMethodRepository,
  CreatePaymentMethodParams,
  UpdatePaymentMethodParams,
} from "@/domain/repositories/PaymentMethodRepository";

export class PrismaPaymentMethodRepository implements PaymentMethodRepository {
  private static instance: PrismaPaymentMethodRepository;

  private constructor() {}

  public static getInstance(): PrismaPaymentMethodRepository {
    if (!PrismaPaymentMethodRepository.instance) {
      PrismaPaymentMethodRepository.instance =
        new PrismaPaymentMethodRepository();
    }
    return PrismaPaymentMethodRepository.instance;
  }

  /**
   * Map Prisma payment method to domain entity
   */
  private mapToDomain(prismaMethod: any): PaymentMethod {
    return new PaymentMethod(
      prismaMethod.id,
      prismaMethod.name,
      prismaMethod.code,
      prismaMethod.type,
      prismaMethod.transactionFee.toNumber(),
      prismaMethod.feePercentage?.toNumber() || null,
      prismaMethod.taxPercentage?.toNumber() || null,
      prismaMethod.minAmount.toNumber(),
      prismaMethod.maxAmount?.toNumber() || null,
      prismaMethod.isActive,
      prismaMethod.iconUrl,
      prismaMethod.description,
      prismaMethod.displayOrder,
      prismaMethod.createdAt,
      prismaMethod.updatedAt
    );
  }

  async create(params: CreatePaymentMethodParams): Promise<PaymentMethod> {
    const paymentMethod = await prisma.donationPaymentMethod.create({
      data: {
        name: params.name,
        code: params.code,
        type: params.type,
        transactionFee: params.transactionFee,
        feePercentage: params.feePercentage,
        taxPercentage: params.taxPercentage,
        minAmount: params.minAmount,
        maxAmount: params.maxAmount,
        iconUrl: params.iconUrl,
        description: params.description,
        displayOrder: params.displayOrder || 0,
        isActive: true,
      },
    });

    return this.mapToDomain(paymentMethod);
  }

  async findById(id: string): Promise<PaymentMethod | null> {
    const paymentMethod = await prisma.donationPaymentMethod.findUnique({
      where: { id },
    });

    return paymentMethod ? this.mapToDomain(paymentMethod) : null;
  }

  async findByCode(code: string): Promise<PaymentMethod | null> {
    const paymentMethod = await prisma.donationPaymentMethod.findUnique({
      where: { code },
    });

    return paymentMethod ? this.mapToDomain(paymentMethod) : null;
  }

  async findAllActive(): Promise<PaymentMethod[]> {
    const paymentMethods = await prisma.donationPaymentMethod.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });

    return paymentMethods.map((m) => this.mapToDomain(m));
  }

  async findAll(): Promise<PaymentMethod[]> {
    const paymentMethods = await prisma.donationPaymentMethod.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return paymentMethods.map((m) => this.mapToDomain(m));
  }

  async update(
    id: string,
    params: UpdatePaymentMethodParams
  ): Promise<PaymentMethod> {
    const paymentMethod = await prisma.donationPaymentMethod.update({
      where: { id },
      data: {
        name: params.name,
        transactionFee: params.transactionFee,
        feePercentage: params.feePercentage,
        taxPercentage: params.taxPercentage,
        minAmount: params.minAmount,
        maxAmount: params.maxAmount,
        isActive: params.isActive,
        iconUrl: params.iconUrl,
        description: params.description,
        displayOrder: params.displayOrder,
      },
    });

    return this.mapToDomain(paymentMethod);
  }

  async delete(id: string): Promise<void> {
    await prisma.donationPaymentMethod.delete({
      where: { id },
    });
  }

  async toggleActive(id: string): Promise<PaymentMethod> {
    const current = await prisma.donationPaymentMethod.findUnique({
      where: { id },
    });

    if (!current) {
      throw new Error("Payment method not found");
    }

    const updated = await prisma.donationPaymentMethod.update({
      where: { id },
      data: { isActive: !current.isActive },
    });

    return this.mapToDomain(updated);
  }
}
