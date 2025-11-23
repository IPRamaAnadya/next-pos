/**
 * Application Services: Customer Messaging Service Container
 * Dependency injection container for customer messaging feature
 */

import { PrismaMessageTemplateRepository } from "@/infrastructure/repositories/PrismaMessageTemplateRepository";
import { PrismaMessagingConfigRepository } from "@/infrastructure/repositories/PrismaMessagingConfigRepository";
import { PrismaMessageLogRepository } from "@/infrastructure/repositories/PrismaMessageLogRepository";
import { MessagingProviderFactory } from "@/infrastructure/services/MessagingProviderFactory";

import {
  SendMessageUseCase,
  SendMessageWithTemplateUseCase,
  GetMessageLogsUseCase,
  GetMessageLogByIdUseCase,
} from "@/application/use-cases/CustomerMessagingUseCases";

import {
  CreateMessageTemplateUseCase,
  GetMessageTemplatesUseCase,
  GetMessageTemplateByIdUseCase,
  UpdateMessageTemplateUseCase,
  DeleteMessageTemplateUseCase,
  PreviewMessageTemplateUseCase,
} from "@/application/use-cases/MessageTemplateUseCases";

import {
  CreateMessagingConfigUseCase,
  GetMessagingConfigsUseCase,
  GetMessagingConfigByIdUseCase,
  UpdateMessagingConfigUseCase,
  DeleteMessagingConfigUseCase,
  TestMessagingConfigUseCase,
  GetAvailableProvidersUseCase,
} from "@/application/use-cases/MessagingConfigUseCases";

import { CustomerMessagingController } from "@/presentation/controllers/CustomerMessagingController";

export class CustomerMessagingServiceContainer {
  private static instance: CustomerMessagingServiceContainer;

  // Repositories
  private _messageTemplateRepository?: PrismaMessageTemplateRepository;
  private _messagingConfigRepository?: PrismaMessagingConfigRepository;
  private _messageLogRepository?: PrismaMessageLogRepository;
  private _providerFactory?: MessagingProviderFactory;

  // Messaging Use Cases
  private _sendMessageUseCase?: SendMessageUseCase;
  private _sendMessageWithTemplateUseCase?: SendMessageWithTemplateUseCase;
  private _getMessageLogsUseCase?: GetMessageLogsUseCase;
  private _getMessageLogByIdUseCase?: GetMessageLogByIdUseCase;

  // Template Use Cases
  private _createMessageTemplateUseCase?: CreateMessageTemplateUseCase;
  private _getMessageTemplatesUseCase?: GetMessageTemplatesUseCase;
  private _getMessageTemplateByIdUseCase?: GetMessageTemplateByIdUseCase;
  private _updateMessageTemplateUseCase?: UpdateMessageTemplateUseCase;
  private _deleteMessageTemplateUseCase?: DeleteMessageTemplateUseCase;
  private _previewMessageTemplateUseCase?: PreviewMessageTemplateUseCase;

  // Config Use Cases
  private _createMessagingConfigUseCase?: CreateMessagingConfigUseCase;
  private _getMessagingConfigsUseCase?: GetMessagingConfigsUseCase;
  private _getMessagingConfigByIdUseCase?: GetMessagingConfigByIdUseCase;
  private _updateMessagingConfigUseCase?: UpdateMessagingConfigUseCase;
  private _deleteMessagingConfigUseCase?: DeleteMessagingConfigUseCase;
  private _testMessagingConfigUseCase?: TestMessagingConfigUseCase;
  private _getAvailableProvidersUseCase?: GetAvailableProvidersUseCase;

  // Controller
  private _customerMessagingController?: CustomerMessagingController;

  private constructor() {}

  public static getInstance(): CustomerMessagingServiceContainer {
    if (!CustomerMessagingServiceContainer.instance) {
      CustomerMessagingServiceContainer.instance = new CustomerMessagingServiceContainer();
    }
    return CustomerMessagingServiceContainer.instance;
  }

  // Repository Getters
  get messageTemplateRepository(): PrismaMessageTemplateRepository {
    if (!this._messageTemplateRepository) {
      this._messageTemplateRepository = PrismaMessageTemplateRepository.getInstance();
    }
    return this._messageTemplateRepository;
  }

  get messagingConfigRepository(): PrismaMessagingConfigRepository {
    if (!this._messagingConfigRepository) {
      this._messagingConfigRepository = PrismaMessagingConfigRepository.getInstance();
    }
    return this._messagingConfigRepository;
  }

  get messageLogRepository(): PrismaMessageLogRepository {
    if (!this._messageLogRepository) {
      this._messageLogRepository = PrismaMessageLogRepository.getInstance();
    }
    return this._messageLogRepository;
  }

  get providerFactory(): MessagingProviderFactory {
    if (!this._providerFactory) {
      this._providerFactory = MessagingProviderFactory.getInstance();
    }
    return this._providerFactory;
  }

  // Messaging Use Case Getters
  get sendMessageUseCase(): SendMessageUseCase {
    if (!this._sendMessageUseCase) {
      this._sendMessageUseCase = SendMessageUseCase.getInstance(
        this.messageLogRepository,
        this.messagingConfigRepository,
        this.messageTemplateRepository,
        this.providerFactory
      );
    }
    return this._sendMessageUseCase;
  }

  get sendMessageWithTemplateUseCase(): SendMessageWithTemplateUseCase {
    if (!this._sendMessageWithTemplateUseCase) {
      this._sendMessageWithTemplateUseCase = SendMessageWithTemplateUseCase.getInstance(
        this.messageLogRepository,
        this.messagingConfigRepository,
        this.messageTemplateRepository,
        this.providerFactory
      );
    }
    return this._sendMessageWithTemplateUseCase;
  }

  get getMessageLogsUseCase(): GetMessageLogsUseCase {
    if (!this._getMessageLogsUseCase) {
      this._getMessageLogsUseCase = GetMessageLogsUseCase.getInstance(
        this.messageLogRepository
      );
    }
    return this._getMessageLogsUseCase;
  }

  get getMessageLogByIdUseCase(): GetMessageLogByIdUseCase {
    if (!this._getMessageLogByIdUseCase) {
      this._getMessageLogByIdUseCase = GetMessageLogByIdUseCase.getInstance(
        this.messageLogRepository
      );
    }
    return this._getMessageLogByIdUseCase;
  }

  // Template Use Case Getters
  get createMessageTemplateUseCase(): CreateMessageTemplateUseCase {
    if (!this._createMessageTemplateUseCase) {
      this._createMessageTemplateUseCase = CreateMessageTemplateUseCase.getInstance(
        this.messageTemplateRepository
      );
    }
    return this._createMessageTemplateUseCase;
  }

  get getMessageTemplatesUseCase(): GetMessageTemplatesUseCase {
    if (!this._getMessageTemplatesUseCase) {
      this._getMessageTemplatesUseCase = GetMessageTemplatesUseCase.getInstance(
        this.messageTemplateRepository
      );
    }
    return this._getMessageTemplatesUseCase;
  }

  get getMessageTemplateByIdUseCase(): GetMessageTemplateByIdUseCase {
    if (!this._getMessageTemplateByIdUseCase) {
      this._getMessageTemplateByIdUseCase = GetMessageTemplateByIdUseCase.getInstance(
        this.messageTemplateRepository
      );
    }
    return this._getMessageTemplateByIdUseCase;
  }

  get updateMessageTemplateUseCase(): UpdateMessageTemplateUseCase {
    if (!this._updateMessageTemplateUseCase) {
      this._updateMessageTemplateUseCase = UpdateMessageTemplateUseCase.getInstance(
        this.messageTemplateRepository
      );
    }
    return this._updateMessageTemplateUseCase;
  }

  get deleteMessageTemplateUseCase(): DeleteMessageTemplateUseCase {
    if (!this._deleteMessageTemplateUseCase) {
      this._deleteMessageTemplateUseCase = DeleteMessageTemplateUseCase.getInstance(
        this.messageTemplateRepository
      );
    }
    return this._deleteMessageTemplateUseCase;
  }

  get previewMessageTemplateUseCase(): PreviewMessageTemplateUseCase {
    if (!this._previewMessageTemplateUseCase) {
      this._previewMessageTemplateUseCase = PreviewMessageTemplateUseCase.getInstance(
        this.messageTemplateRepository
      );
    }
    return this._previewMessageTemplateUseCase;
  }

  // Config Use Case Getters
  get createMessagingConfigUseCase(): CreateMessagingConfigUseCase {
    if (!this._createMessagingConfigUseCase) {
      this._createMessagingConfigUseCase = CreateMessagingConfigUseCase.getInstance(
        this.messagingConfigRepository,
        this.providerFactory
      );
    }
    return this._createMessagingConfigUseCase;
  }

  get getMessagingConfigsUseCase(): GetMessagingConfigsUseCase {
    if (!this._getMessagingConfigsUseCase) {
      this._getMessagingConfigsUseCase = GetMessagingConfigsUseCase.getInstance(
        this.messagingConfigRepository
      );
    }
    return this._getMessagingConfigsUseCase;
  }

  get getMessagingConfigByIdUseCase(): GetMessagingConfigByIdUseCase {
    if (!this._getMessagingConfigByIdUseCase) {
      this._getMessagingConfigByIdUseCase = GetMessagingConfigByIdUseCase.getInstance(
        this.messagingConfigRepository
      );
    }
    return this._getMessagingConfigByIdUseCase;
  }

  get updateMessagingConfigUseCase(): UpdateMessagingConfigUseCase {
    if (!this._updateMessagingConfigUseCase) {
      this._updateMessagingConfigUseCase = UpdateMessagingConfigUseCase.getInstance(
        this.messagingConfigRepository,
        this.providerFactory
      );
    }
    return this._updateMessagingConfigUseCase;
  }

  get deleteMessagingConfigUseCase(): DeleteMessagingConfigUseCase {
    if (!this._deleteMessagingConfigUseCase) {
      this._deleteMessagingConfigUseCase = DeleteMessagingConfigUseCase.getInstance(
        this.messagingConfigRepository
      );
    }
    return this._deleteMessagingConfigUseCase;
  }

  get testMessagingConfigUseCase(): TestMessagingConfigUseCase {
    if (!this._testMessagingConfigUseCase) {
      this._testMessagingConfigUseCase = TestMessagingConfigUseCase.getInstance(
        this.messagingConfigRepository,
        this.providerFactory
      );
    }
    return this._testMessagingConfigUseCase;
  }

  get getAvailableProvidersUseCase(): GetAvailableProvidersUseCase {
    if (!this._getAvailableProvidersUseCase) {
      this._getAvailableProvidersUseCase = GetAvailableProvidersUseCase.getInstance(
        this.providerFactory
      );
    }
    return this._getAvailableProvidersUseCase;
  }

  // Controller Getter
  get customerMessagingController(): CustomerMessagingController {
    if (!this._customerMessagingController) {
      this._customerMessagingController = new CustomerMessagingController(
        this.sendMessageUseCase,
        this.sendMessageWithTemplateUseCase,
        this.getMessageLogsUseCase,
        this.getMessageLogByIdUseCase,
        this.createMessageTemplateUseCase,
        this.getMessageTemplatesUseCase,
        this.getMessageTemplateByIdUseCase,
        this.updateMessageTemplateUseCase,
        this.deleteMessageTemplateUseCase,
        this.previewMessageTemplateUseCase,
        this.createMessagingConfigUseCase,
        this.getMessagingConfigsUseCase,
        this.getMessagingConfigByIdUseCase,
        this.updateMessagingConfigUseCase,
        this.deleteMessagingConfigUseCase,
        this.testMessagingConfigUseCase,
        this.getAvailableProvidersUseCase
      );
    }
    return this._customerMessagingController;
  }
}
