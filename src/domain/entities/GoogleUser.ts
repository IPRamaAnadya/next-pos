export class GoogleUser {
  constructor(
    public readonly uid: string,
    public readonly email: string,
    public readonly displayName: string | null,
    public readonly photoURL: string | null,
    public readonly emailVerified: boolean,
    public readonly providerId: string,
    public readonly accessToken?: string,
    public readonly idToken?: string,
  ) {}

  // Business logic methods
  public isValidGoogleUser(): boolean {
    return this.uid.length > 0 && this.email.length > 0 && this.providerId === 'google.com';
  }

  public hasValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  public isEmailVerified(): boolean {
    return this.emailVerified;
  }

  public hasDisplayName(): boolean {
    return !!this.displayName && this.displayName.trim().length > 0;
  }

  public hasProfilePhoto(): boolean {
    return !!this.photoURL;
  }

  public canCreateAccount(): boolean {
    return this.isValidGoogleUser() && this.hasValidEmail() && this.isEmailVerified();
  }

  // Create a safe version for API responses
  public toSafeObject() {
    return {
      uid: this.uid,
      email: this.email,
      displayName: this.displayName,
      photoURL: this.photoURL,
      emailVerified: this.emailVerified,
      providerId: this.providerId,
    };
  }

  // Convert to user creation data
  public toUserCreationData() {
    return {
      email: this.email,
      // Generate a secure random password since Google users don't need passwords
      password: this.generateSecurePassword(),
      displayName: this.displayName,
      photoURL: this.photoURL,
      provider: 'google',
      providerId: this.uid,
      emailVerified: this.emailVerified,
    };
  }

  private generateSecurePassword(): string {
    // Generate a 32-character random password for Google users
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 32; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}