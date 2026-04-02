/**
 * Messaging Config Use Cases
 * Application layer business logic for messaging configuration management
 */

import { MessagingConfig, MessagingProvider, ProviderConfig } from "../../domain/entities/MessagingConfig";
import { MessagingConfigRepository } from "../../domain/repositories/MessagingConfigRepository";
import { MessagingProviderFactory } from "../../infrastructure/services/MessagingProviderFactory";

/**
 * Create Messaging Config Use Case
 */
export class CreateMessagingConfigUseCase {
  private static instance: CreateMessagingConfigUseCase;

  private constructor(
    private configRepository: MessagingConfigRepository,
    private providerFactory: MessagingProviderFactory
  ) {}

  public static getInstance(
    configRepository: MessagingConfigRepository,
    providerFactory: MessagingProviderFactory
  ): CreateMessagingConfigUseCase {
    if (!CreateMessagingConfigUseCase.instance) {
      CreateMessagingConfigUseCase.instance = new CreateMessagingConfigUseCase(
        configRepository,
        providerFactory
      );
    }
    return CreateMessagingConfigUseCase.instance;
  }

  async execute(params: {
    tenantId: string;
    provider: MessagingProvider;
    config: ProviderConfig;
    isActive: boolean;
  }): Promise<MessagingConfig> {
    // Check if provider is supported
    if (!this.providerFactory.isProviderSupported(params.provider)) {
      throw new Error(`Provider not supported: ${params.provider}`);
    }

    // Validate config using provider
    const provider = this.providerFactory.createProvider(params.provider, params.config);
    const validation = provider.validateConfig(params.config);

    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(", ")}`);
    }

    // Check if config for this provider already exists
    const existing = await this.configRepository.findByProvider(
      params.tenantId,
      params.provider
    );

    if (existing) {
      throw new Error(`Configuration for ${params.provider} already exists`);
    }

    // If activating this config, deactivate others
    if (params.isActive) {
      await this.configRepository.deactivateAll(params.tenantId);
    }

    return await this.configRepository.create(params);
  }
}

/**
 * Get Messaging Configs Use Case
 */
export class GetMessagingConfigsUseCase {
  private static instance: GetMessagingConfigsUseCase;

  private constructor(private configRepository: MessagingConfigRepository) {}

  public static getInstance(
    configRepository: MessagingConfigRepository
  ): GetMessagingConfigsUseCase {
    if (!GetMessagingConfigsUseCase.instance) {
      GetMessagingConfigsUseCase.instance = new GetMessagingConfigsUseCase(
        configRepository
      );
    }
    return GetMessagingConfigsUseCase.instance;
  }

  async execute(tenantId: string): Promise<MessagingConfig[]> {
    return await this.configRepository.findAllByTenant(tenantId);
  }
}

/**
 * Get Messaging Config by ID Use Case
 */
export class GetMessagingConfigByIdUseCase {
  private static instance: GetMessagingConfigByIdUseCase;

  private constructor(private configRepository: MessagingConfigRepository) {}

  public static getInstance(
    configRepository: MessagingConfigRepository
  ): GetMessagingConfigByIdUseCase {
    if (!GetMessagingConfigByIdUseCase.instance) {
      GetMessagingConfigByIdUseCase.instance = new GetMessagingConfigByIdUseCase(
        configRepository
      );
    }
    return GetMessagingConfigByIdUseCase.instance;
  }

  async execute(id: string, tenantId: string): Promise<MessagingConfig> {
    const config = await this.configRepository.findById(id, tenantId);

    if (!config) {
      throw new Error(`Configuration not found: ${id}`);
    }

    return config;
  }
}

/**
 * Update Messaging Config Use Case
 */
export class UpdateMessagingConfigUseCase {
  private static instance: UpdateMessagingConfigUseCase;

  private constructor(
    private configRepository: MessagingConfigRepository,
    private providerFactory: MessagingProviderFactory
  ) {}

  public static getInstance(
    configRepository: MessagingConfigRepository,
    providerFactory: MessagingProviderFactory
  ): UpdateMessagingConfigUseCase {
    if (!UpdateMessagingConfigUseCase.instance) {
      UpdateMessagingConfigUseCase.instance = new UpdateMessagingConfigUseCase(
        configRepository,
        providerFactory
      );
    }
    return UpdateMessagingConfigUseCase.instance;
  }

  async execute(params: {
    id: string;
    tenantId: string;
    config?: ProviderConfig;
    isActive?: boolean;
  }): Promise<MessagingConfig> {
    // Check if config exists
    const existingConfig = await this.configRepository.findById(params.id, params.tenantId);

    if (!existingConfig) {
      throw new Error(`Configuration not found: ${params.id}`);
    }

    // If updating config, validate it
    if (params.config) {
      const provider = this.providerFactory.createProvider(
        existingConfig.provider,
        { ...existingConfig.config, ...params.config }
      );
      const validation = provider.validateConfig({ ...existingConfig.config, ...params.config });

      if (!validation.isValid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(", ")}`);
      }
    }

    // If activating this config, deactivate others
    if (params.isActive === true) {
      await this.configRepository.deactivateAll(params.tenantId);
    }

    return await this.configRepository.update(params.id, params.tenantId, {
      config: params.config,
      isActive: params.isActive,
    });
  }
}

/**
 * Delete Messaging Config Use Case
 */
export class DeleteMessagingConfigUseCase {
  private static instance: DeleteMessagingConfigUseCase;

  private constructor(private configRepository: MessagingConfigRepository) {}

  public static getInstance(
    configRepository: MessagingConfigRepository
  ): DeleteMessagingConfigUseCase {
    if (!DeleteMessagingConfigUseCase.instance) {
      DeleteMessagingConfigUseCase.instance = new DeleteMessagingConfigUseCase(
        configRepository
      );
    }
    return DeleteMessagingConfigUseCase.instance;
  }

  async execute(id: string, tenantId: string): Promise<void> {
    const config = await this.configRepository.findById(id, tenantId);

    if (!config) {
      throw new Error(`Configuration not found: ${id}`);
    }

    await this.configRepository.delete(id, tenantId);
  }
}

/**
 * Test Messaging Config Use Case
 */
export class TestMessagingConfigUseCase {
  private static instance: TestMessagingConfigUseCase;

  private constructor(
    private configRepository: MessagingConfigRepository,
    private providerFactory: MessagingProviderFactory
  ) {}

  public static getInstance(
    configRepository: MessagingConfigRepository,
    providerFactory: MessagingProviderFactory
  ): TestMessagingConfigUseCase {
    if (!TestMessagingConfigUseCase.instance) {
      TestMessagingConfigUseCase.instance = new TestMessagingConfigUseCase(
        configRepository,
        providerFactory
      );
    }
    return TestMessagingConfigUseCase.instance;
  }

  async execute(id: string, tenantId: string): Promise<{ success: boolean; message: string }> {
    const config = await this.configRepository.findById(id, tenantId);

    if (!config) {
      throw new Error(`Configuration not found: ${id}`);
    }

    const provider = this.providerFactory.createProvider(config.provider, config.config);
    return await provider.testConnection();
  }
}

/**
 * Get Available Providers Use Case
 */
export class GetAvailableProvidersUseCase {
  private static instance: GetAvailableProvidersUseCase;

  private constructor(private providerFactory: MessagingProviderFactory) {}

  public static getInstance(
    providerFactory: MessagingProviderFactory
  ): GetAvailableProvidersUseCase {
    if (!GetAvailableProvidersUseCase.instance) {
      GetAvailableProvidersUseCase.instance = new GetAvailableProvidersUseCase(
        providerFactory
      );
    }
    return GetAvailableProvidersUseCase.instance;
  }

  async execute() {
    return this.providerFactory.getAvailableProviders();
  }
}
