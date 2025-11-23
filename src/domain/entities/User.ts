export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly password: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly displayName?: string | null,
    public readonly photoURL?: string | null,
    public readonly provider?: string | null,
    public readonly providerId?: string | null,
    public readonly emailVerified?: boolean,
  ) {}

  // Business logic methods
  public isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  public hasValidPassword(): boolean {
    // Password should be at least 6 characters
    return this.password.length >= 6;
  }

  public isActive(): boolean {
    // User is active if it has been created
    return !!this.id;
  }

  public canLogin(): boolean {
    return this.isValidEmail() && this.isActive();
  }

  public isGoogleUser(): boolean {
    return this.provider === 'google';
  }

  public isEmailUser(): boolean {
    return !this.provider || this.provider === 'email';
  }

  public hasProfilePhoto(): boolean {
    return !!this.photoURL;
  }

  public getDisplayName(): string {
    return this.displayName || this.email.split('@')[0];
  }

  // Create a safe version without password for responses
  public toSafeObject() {
    return {
      id: this.id,
      email: this.email,
      displayName: this.displayName,
      photoURL: this.photoURL,
      provider: this.provider,
      emailVerified: this.emailVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}