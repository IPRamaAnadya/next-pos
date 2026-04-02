import { GoogleAuthClient } from './googleAuth';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  tenantName: string;
  tenantAddress?: string;
  tenantPhone?: string;
}

export interface GoogleLoginData {
  idToken: string;
  tenantName?: string;
  tenantAddress?: string;
  tenantPhone?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    display_name?: string;
    photo_url?: string;
    provider?: string;
    email_verified?: boolean;
    tenant_id?: string;
    tenant_name?: string;
    role: string;
    staff_id?: string;
    limits?: any;
    subscription_end_date?: string;
  };
  is_new_user?: boolean;
}

export class AuthAPIClient {
  private static baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  /**
   * Regular email/password login
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/api/v2/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!data.meta.success) {
      throw new Error(data.meta.message || 'Login failed');
    }

    return data.data;
  }

  /**
   * User registration
   */
  static async signup(signupData: SignupData): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/api/v2/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupData),
    });

    const data = await response.json();

    if (!data.meta.success) {
      throw new Error(data.meta.message || 'Signup failed');
    }

    return data.data;
  }

  /**
   * Google login
   */
  static async googleLogin(googleData: GoogleLoginData): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/api/v2/auth/login/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleData),
    });

    const data = await response.json();

    if (!data.meta.success) {
      throw new Error(data.meta.message || 'Google login failed');
    }

    return data.data;
  }

  /**
   * Complete Google sign-in flow with popup
   */
  static async signInWithGoogle(tenantInfo?: {
    tenantName: string;
    tenantAddress?: string;
    tenantPhone?: string;
  }): Promise<AuthResponse> {
    try {
      // Step 1: Sign in with Google popup
      const googleResult = await GoogleAuthClient.signInWithGoogle();

      // Step 2: Send ID token to our backend
      const googleLoginData: GoogleLoginData = {
        idToken: googleResult.idToken,
        ...tenantInfo,
      };

      return await this.googleLogin(googleLoginData);
    } catch (error: any) {
      console.error('Google sign-in flow error:', error);
      throw error;
    }
  }

  /**
   * Validate token
   */
  static async validateToken(token: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v2/auth/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!data.meta.success) {
      throw new Error(data.meta.message || 'Token validation failed');
    }

    return data.data;
  }

  /**
   * Get user profile
   */
  static async getUserProfile(token: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v2/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!data.meta.success) {
      throw new Error(data.meta.message || 'Failed to get user profile');
    }

    return data.data;
  }

  /**
   * Store token in localStorage
   */
  static storeToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  /**
   * Get token from localStorage
   */
  static getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  /**
   * Remove token from localStorage
   */
  static removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Complete logout (clear token and sign out from Google)
   */
  static async logout(): Promise<void> {
    try {
      // Remove token from storage
      this.removeToken();

      // Sign out from Google if signed in
      if (GoogleAuthClient.isSignedIn()) {
        await GoogleAuthClient.signOut();
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove token even if Google signout fails
      this.removeToken();
    }
  }
}