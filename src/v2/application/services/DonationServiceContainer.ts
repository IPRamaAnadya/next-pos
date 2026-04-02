/**
 * Application Services: Donation Service Container
 * Dependency injection container for donation feature
 */

import { PrismaDonationRepository } from "@/infrastructure/repositories/PrismaDonationRepository";
import { PrismaPaymentMethodRepository } from "@/infrastructure/repositories/PrismaPaymentMethodRepository";
import {
  CreateDonationUseCase,
  GetDonationDetailUseCase,
  GetTenantDonationsUseCase,
  GetMonthlyDonationSummaryUseCase,
  UpdateDonationFromWebhookUseCase,
  GetAllDonationsUseCase,
  GetDonationStatisticsUseCase,
  GetMonthlyReportUseCase,
  GetYearlyReportUseCase,
} from "@/application/use-cases/DonationUseCases";
import {
  GetActivePaymentMethodsUseCase,
  GetPaymentMethodDetailUseCase,
  GetAllPaymentMethodsUseCase,
  CreatePaymentMethodUseCase,
  UpdatePaymentMethodUseCase,
  TogglePaymentMethodActiveUseCase,
  DeletePaymentMethodUseCase,
} from "@/application/use-cases/PaymentMethodUseCases";
import { DonationController } from "@/presentation/controllers/DonationController";
import { PaymentMethodController } from "@/presentation/controllers/PaymentMethodController";

export class DonationServiceContainer {
  private static instance: DonationServiceContainer;

  // Repositories
  private _donationRepository?: PrismaDonationRepository;
  private _paymentMethodRepository?: PrismaPaymentMethodRepository;

  // Donation Use Cases
  private _createDonationUseCase?: CreateDonationUseCase;
  private _getDonationDetailUseCase?: GetDonationDetailUseCase;
  private _getTenantDonationsUseCase?: GetTenantDonationsUseCase;
  private _getMonthlyDonationSummaryUseCase?: GetMonthlyDonationSummaryUseCase;
  private _updateDonationFromWebhookUseCase?: UpdateDonationFromWebhookUseCase;
  private _getAllDonationsUseCase?: GetAllDonationsUseCase;
  private _getDonationStatisticsUseCase?: GetDonationStatisticsUseCase;
  private _getMonthlyReportUseCase?: GetMonthlyReportUseCase;
  private _getYearlyReportUseCase?: GetYearlyReportUseCase;

  // Payment Method Use Cases
  private _getActivePaymentMethodsUseCase?: GetActivePaymentMethodsUseCase;
  private _getPaymentMethodDetailUseCase?: GetPaymentMethodDetailUseCase;
  private _getAllPaymentMethodsUseCase?: GetAllPaymentMethodsUseCase;
  private _createPaymentMethodUseCase?: CreatePaymentMethodUseCase;
  private _updatePaymentMethodUseCase?: UpdatePaymentMethodUseCase;
  private _togglePaymentMethodActiveUseCase?: TogglePaymentMethodActiveUseCase;
  private _deletePaymentMethodUseCase?: DeletePaymentMethodUseCase;

  // Controllers
  private _donationController?: DonationController;
  private _paymentMethodController?: PaymentMethodController;

  private constructor() {}

  public static getInstance(): DonationServiceContainer {
    if (!DonationServiceContainer.instance) {
      DonationServiceContainer.instance = new DonationServiceContainer();
    }
    return DonationServiceContainer.instance;
  }

  // Repository Getters
  get donationRepository(): PrismaDonationRepository {
    if (!this._donationRepository) {
      this._donationRepository = PrismaDonationRepository.getInstance();
    }
    return this._donationRepository;
  }

  get paymentMethodRepository(): PrismaPaymentMethodRepository {
    if (!this._paymentMethodRepository) {
      this._paymentMethodRepository =
        PrismaPaymentMethodRepository.getInstance();
    }
    return this._paymentMethodRepository;
  }

  // Donation Use Case Getters
  get createDonationUseCase(): CreateDonationUseCase {
    if (!this._createDonationUseCase) {
      this._createDonationUseCase = new CreateDonationUseCase(
        this.donationRepository,
        this.paymentMethodRepository
      );
    }
    return this._createDonationUseCase;
  }

  get getDonationDetailUseCase(): GetDonationDetailUseCase {
    if (!this._getDonationDetailUseCase) {
      this._getDonationDetailUseCase = new GetDonationDetailUseCase(
        this.donationRepository
      );
    }
    return this._getDonationDetailUseCase;
  }

  get getTenantDonationsUseCase(): GetTenantDonationsUseCase {
    if (!this._getTenantDonationsUseCase) {
      this._getTenantDonationsUseCase = new GetTenantDonationsUseCase(
        this.donationRepository
      );
    }
    return this._getTenantDonationsUseCase;
  }

  get getMonthlyDonationSummaryUseCase(): GetMonthlyDonationSummaryUseCase {
    if (!this._getMonthlyDonationSummaryUseCase) {
      this._getMonthlyDonationSummaryUseCase =
        new GetMonthlyDonationSummaryUseCase(this.donationRepository);
    }
    return this._getMonthlyDonationSummaryUseCase;
  }

  get updateDonationFromWebhookUseCase(): UpdateDonationFromWebhookUseCase {
    if (!this._updateDonationFromWebhookUseCase) {
      this._updateDonationFromWebhookUseCase =
        new UpdateDonationFromWebhookUseCase(this.donationRepository);
    }
    return this._updateDonationFromWebhookUseCase;
  }

  get getAllDonationsUseCase(): GetAllDonationsUseCase {
    if (!this._getAllDonationsUseCase) {
      this._getAllDonationsUseCase = new GetAllDonationsUseCase(
        this.donationRepository
      );
    }
    return this._getAllDonationsUseCase;
  }

  get getDonationStatisticsUseCase(): GetDonationStatisticsUseCase {
    if (!this._getDonationStatisticsUseCase) {
      this._getDonationStatisticsUseCase = new GetDonationStatisticsUseCase(
        this.donationRepository
      );
    }
    return this._getDonationStatisticsUseCase;
  }

  get getMonthlyReportUseCase(): GetMonthlyReportUseCase {
    if (!this._getMonthlyReportUseCase) {
      this._getMonthlyReportUseCase = new GetMonthlyReportUseCase(
        this.donationRepository
      );
    }
    return this._getMonthlyReportUseCase;
  }

  get getYearlyReportUseCase(): GetYearlyReportUseCase {
    if (!this._getYearlyReportUseCase) {
      this._getYearlyReportUseCase = new GetYearlyReportUseCase(
        this.donationRepository
      );
    }
    return this._getYearlyReportUseCase;
  }

  // Payment Method Use Case Getters
  get getActivePaymentMethodsUseCase(): GetActivePaymentMethodsUseCase {
    if (!this._getActivePaymentMethodsUseCase) {
      this._getActivePaymentMethodsUseCase =
        new GetActivePaymentMethodsUseCase(this.paymentMethodRepository);
    }
    return this._getActivePaymentMethodsUseCase;
  }

  get getPaymentMethodDetailUseCase(): GetPaymentMethodDetailUseCase {
    if (!this._getPaymentMethodDetailUseCase) {
      this._getPaymentMethodDetailUseCase = new GetPaymentMethodDetailUseCase(
        this.paymentMethodRepository
      );
    }
    return this._getPaymentMethodDetailUseCase;
  }

  get getAllPaymentMethodsUseCase(): GetAllPaymentMethodsUseCase {
    if (!this._getAllPaymentMethodsUseCase) {
      this._getAllPaymentMethodsUseCase = new GetAllPaymentMethodsUseCase(
        this.paymentMethodRepository
      );
    }
    return this._getAllPaymentMethodsUseCase;
  }

  get createPaymentMethodUseCase(): CreatePaymentMethodUseCase {
    if (!this._createPaymentMethodUseCase) {
      this._createPaymentMethodUseCase = new CreatePaymentMethodUseCase(
        this.paymentMethodRepository
      );
    }
    return this._createPaymentMethodUseCase;
  }

  get updatePaymentMethodUseCase(): UpdatePaymentMethodUseCase {
    if (!this._updatePaymentMethodUseCase) {
      this._updatePaymentMethodUseCase = new UpdatePaymentMethodUseCase(
        this.paymentMethodRepository
      );
    }
    return this._updatePaymentMethodUseCase;
  }

  get togglePaymentMethodActiveUseCase(): TogglePaymentMethodActiveUseCase {
    if (!this._togglePaymentMethodActiveUseCase) {
      this._togglePaymentMethodActiveUseCase =
        new TogglePaymentMethodActiveUseCase(this.paymentMethodRepository);
    }
    return this._togglePaymentMethodActiveUseCase;
  }

  get deletePaymentMethodUseCase(): DeletePaymentMethodUseCase {
    if (!this._deletePaymentMethodUseCase) {
      this._deletePaymentMethodUseCase = new DeletePaymentMethodUseCase(
        this.paymentMethodRepository
      );
    }
    return this._deletePaymentMethodUseCase;
  }

  // Controller Getters
  get donationController(): DonationController {
    if (!this._donationController) {
      this._donationController = new DonationController(
        this.createDonationUseCase,
        this.getDonationDetailUseCase,
        this.getTenantDonationsUseCase,
        this.getMonthlyDonationSummaryUseCase,
        this.updateDonationFromWebhookUseCase,
        this.getAllDonationsUseCase,
        this.getDonationStatisticsUseCase,
        this.getMonthlyReportUseCase,
        this.getYearlyReportUseCase
      );
    }
    return this._donationController;
  }

  get paymentMethodController(): PaymentMethodController {
    if (!this._paymentMethodController) {
      this._paymentMethodController = new PaymentMethodController(
        this.getActivePaymentMethodsUseCase,
        this.getPaymentMethodDetailUseCase,
        this.getAllPaymentMethodsUseCase,
        this.createPaymentMethodUseCase,
        this.updatePaymentMethodUseCase,
        this.togglePaymentMethodActiveUseCase,
        this.deletePaymentMethodUseCase
      );
    }
    return this._paymentMethodController;
  }
}
