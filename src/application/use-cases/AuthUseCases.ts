import { User } from '../../domain/entities/User';
import { Tenant } from '../../domain/entities/Tenant';
import { AuthSession } from '../../domain/entities/AuthSession';
import { UserRepository, UserData } from '../../domain/repositories/UserRepository';
import { TenantRepository, TenantData } from '../../domain/repositories/TenantRepository';
import { AuthTokenService, PasswordService, GoogleAuthService } from '../../domain/repositories/AuthRepository';
import { GoogleUser } from '../../domain/entities/GoogleUser';
import { AuthDomainService } from '../../domain/services/AuthDomainService';
import { LoginRequest, SignupRequest, CashierLoginRequest, TenantLoginRequest, GoogleLoginRequest } from './interfaces/AuthQueryOptions';
import { getLimitsForTenant } from '@/lib/subscriptionLimit';
import { StaffRepository } from '@/domain/repositories/StaffRepository';

export class AuthUseCases {
  private static instance: AuthUseCases;

  private constructor(
    private userRepository: UserRepository,
    private tenantRepository: TenantRepository,
    private authTokenService: AuthTokenService,
    private passwordService: PasswordService,
    private staffRepository: StaffRepository,
    private authDomainService: AuthDomainService,
    private googleAuthService: GoogleAuthService
  ) {}

  public static getInstance(
    userRepository: UserRepository,
    tenantRepository: TenantRepository,
    authTokenService: AuthTokenService,
    passwordService: PasswordService,
    staffRepository: StaffRepository,
    authDomainService: AuthDomainService,
    googleAuthService: GoogleAuthService
  ): AuthUseCases {
    if (!AuthUseCases.instance) {
      AuthUseCases.instance = new AuthUseCases(
        userRepository,
        tenantRepository,
        authTokenService,
        passwordService,
        staffRepository,
        authDomainService,
        googleAuthService
      );
    }
    return AuthUseCases.instance;
  }

  async login(request: LoginRequest): Promise<{ token: string; user: any }> {
    // Input validation
    if (!request.email || !request.password) {
      throw new Error('Email and password are required');
    }

    // Find user with tenants
    const userWithTenants = await this.userRepository.findUserWithTenants(request.email);
    if (!userWithTenants) {
      throw new Error('Invalid email or password');
    }

    const { user, tenants } = userWithTenants;

    // Verify password
    const isPasswordValid = await this.authDomainService.verifyUserPassword(
      request.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Get primary tenant
    const primaryTenant = tenants[0];
    if (!primaryTenant) {
      throw new Error('No tenant associated with this user');
    }

    // Get subscription limits
    const limits = await getLimitsForTenant(primaryTenant.id);

    // Get owner staff id if applicable (simplified here)
    const staff = await this.staffRepository.findByUsername(request.email, primaryTenant.id);

    console.log('Staff found during login:', staff, request.email, primaryTenant.id);

    // Create auth payload
    const payload = {
      userId: user.id,
      tenantId: primaryTenant.id,
      role: 'owner',
      staffId: staff ? staff.id : null,
      limits,
      subscriptionEndDate: null, // Will be populated by token service
    };

    // Generate token
    const token = await this.authTokenService.generateToken(payload);

    return {
      token,
      user: {
        ...payload,
        email: user.email,
        tenantName: primaryTenant.name,
        tenantAddress: primaryTenant.address || null,
        tenantPhone: primaryTenant.phone || null,
      },
    };
  }

  async signup(request: SignupRequest): Promise<{ token: string; user: any }> {
    // Input validation
    if (!request.email || !request.password || !request.tenantName) {
      throw new Error('Email, password, and tenant name are required');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await this.authDomainService.hashUserPassword(request.password);

    // Create user
    const userData: UserData = {
      email: request.email,
      password: hashedPassword,
    };
    const user = await this.userRepository.create(userData);

    // Validate user
    AuthDomainService.validateUserCredentials(user);

    // Create tenant
    const tenantData: TenantData = {
      userId: user.id,
      name: request.tenantName,
      email: request.email,
      address: request.tenantAddress || null,
      phone: request.tenantPhone || null,
    };
    const tenant = await this.tenantRepository.create(tenantData);

    // Validate tenant
    AuthDomainService.validateTenantData(tenant);

    // Get subscription limits
    const limits = await getLimitsForTenant(tenant.id);

    // Create auth payload
    const payload = {
      userId: user.id,
      tenantId: tenant.id,
      role: 'owner',
      staffId: null,
      limits,
      subscriptionEndDate: null,
    };

    // Generate token
    const token = await this.authTokenService.generateToken(payload);

    return {
      token,
      user: {
        ...payload,
        email: user.email,
        tenantName: tenant.name,
      },
    };
  }

  async cashierLogin(request: CashierLoginRequest): Promise<{ token: string; user: any }> {
    // This is a simplified version - in reality, you'd have a Staff repository
    // For now, we'll use the existing logic but adapt it to clean architecture
    
    if (!request.username || !request.password) {
      throw new Error('Username and password are required');
    }

    // Find user by email (username)
    const userWithTenants = await this.userRepository.findUserWithTenants(request.username);
    if (!userWithTenants) {
      throw new Error('Invalid credentials');
    }

    const { user, tenants } = userWithTenants;

    // Verify password
    const isPasswordValid = await this.authDomainService.verifyUserPassword(
      request.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Get tenant
    const tenant = tenants.find(t => t.id === request.tenantId) || tenants[0];
    if (!tenant) {
      throw new Error('No access to specified tenant');
    }

    // Get subscription limits
    const limits = await getLimitsForTenant(tenant.id);

    // Create auth payload for staff
    const payload = {
      userId: user.id,
      tenantId: tenant.id,
      role: 'staff',
      staffId: null, // Would be populated from staff table
      limits,
      subscriptionEndDate: null,
    };

    // Generate token
    const token = await this.authTokenService.generateToken(payload);

    return {
      token,
      user: {
        ...payload,
        email: user.email,
        tenantName: tenant.name,
      },
    };
  }

  async tenantLogin(request: TenantLoginRequest): Promise<{ token: string; user: any }> {
    // Input validation
    if (!request.username || !request.password || !request.tenantId) {
      throw new Error('Username, password, and tenant ID are required');
    }

    // Find staff by username and tenantId with password
    const staffWithPassword = await this.staffRepository.findByUsernameWithPassword(request.username, request.tenantId);
    if (!staffWithPassword) {
      throw new Error('Invalid credentials');
    }

    const { staff, password } = staffWithPassword;

    // Verify password
    const isPasswordValid = await this.authDomainService.verifyUserPassword(
      request.password,
      password
    );
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Get tenant
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Get subscription limits
    const limits = await getLimitsForTenant(tenant.id);

    // Create auth payload for staff/tenant user
    const payload = {
      userId: staff.id, // Using staff id as user id for tenant login
      tenantId: tenant.id,
      role: staff.isOwner ? 'owner' : staff.role,
      staffId: staff.id,
      limits,
      subscriptionEndDate: null,
    };

    // Generate token
    const token = await this.authTokenService.generateToken(payload);

    return {
      token,
      user: {
        ...payload,
        username: staff.username,
        tenantName: tenant.name,
        isOwner: staff.isOwner,
      },
    };
  }

  async validateToken(token: string): Promise<AuthSession> {
    const session = this.authTokenService.verifyToken(token);
    if (!session) {
      throw new Error('Invalid or expired token');
    }

    AuthDomainService.validateAuthSession(session);
    return session;
  }

  async validateTenantAccess(token: string, tenantId: string): Promise<AuthSession> {
    const session = await this.validateToken(token);
    AuthDomainService.validateTenantAccess(session, tenantId);
    return session;
  }

  async validateRoleAccess(token: string, requiredRoles: string[]): Promise<AuthSession> {
    const session = await this.validateToken(token);
    AuthDomainService.validateRoleAccess(session, requiredRoles);
    return session;
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async googleLogin(request: GoogleLoginRequest): Promise<{ token: string; user: any; isNewUser: boolean }> {
    // Input validation
    if (!request.idToken) {
      throw new Error('Google ID token is required');
    }

    // Verify Google token and get user info
    const googleUser = await this.googleAuthService.verifyGoogleToken(request.idToken);
    
    // Validate Google user
    AuthDomainService.validateGoogleUserForLogin(googleUser);

    // Check if user already exists
    let existingUser = await this.userRepository.findByEmail(googleUser.email);
    let user: User;
    let tenants: Tenant[] = [];
    let isNewUser = false;

    if (existingUser) {
      // User exists, update Google info if needed
      if (!existingUser.isGoogleUser()) {
        // Update existing email user to include Google provider info
        user = await this.userRepository.update(existingUser.id, {
          provider: 'google',
          providerId: googleUser.uid,
          displayName: googleUser.displayName,
          photoURL: googleUser.photoURL,
          emailVerified: googleUser.emailVerified,
        });
      } else {
        user = existingUser;
      }

      // Get existing tenants
      tenants = await this.tenantRepository.findByUserId(user.id);
    } else {
      // New user - create account
      isNewUser = true;
      
      // Validate Google user for account creation
      AuthDomainService.validateGoogleUser(googleUser);

      // Create user account
      const userCreationData = googleUser.toUserCreationData();
      const hashedPassword = await this.authDomainService.hashUserPassword(userCreationData.password);

      const userData: UserData = {
        email: userCreationData.email,
        password: hashedPassword,
        displayName: userCreationData.displayName,
        photoURL: userCreationData.photoURL,
        provider: userCreationData.provider,
        providerId: userCreationData.providerId,
        emailVerified: userCreationData.emailVerified,
      };

      user = await this.userRepository.create(userData);

      // Create tenant if provided
      if (request.tenantName) {
        const tenantData: TenantData = {
          userId: user.id,
          name: request.tenantName,
          email: user.email,
          address: request.tenantAddress || null,
          phone: request.tenantPhone || null,
        };

        const tenant = await this.tenantRepository.create(tenantData);
        tenants = [tenant];
      }
    }

    // Get primary tenant
    const primaryTenant = tenants[0];
    
    // Get subscription limits if tenant exists
    let limits = null;
    if (primaryTenant) {
      limits = await getLimitsForTenant(primaryTenant.id);
    }

    // Create auth payload
    const payload = {
      userId: user.id,
      tenantId: primaryTenant?.id || null,
      role: primaryTenant ? 'owner' : 'user',
      staffId: null,
      limits,
      subscriptionEndDate: null,
    };

    // Generate token
    const token = await this.authTokenService.generateToken(payload);

    return {
      token,
      user: {
        ...payload,
        email: user.email,
        displayName: user.displayName || user.getDisplayName(),
        photoURL: user.photoURL,
        provider: user.provider,
        emailVerified: user.emailVerified,
        tenantName: primaryTenant?.name || null,
      },
      isNewUser,
    };
  }
}