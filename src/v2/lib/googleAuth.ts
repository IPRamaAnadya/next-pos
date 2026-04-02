import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth } from './firebase';

export interface GoogleAuthResult {
  user: User;
  idToken: string;
  accessToken: string | null;
}

export class GoogleAuthClient {
  private static provider: GoogleAuthProvider;

  static {
    this.provider = new GoogleAuthProvider();
    // Request additional scopes if needed
    this.provider.addScope('email');
    this.provider.addScope('profile');
  }

  /**
   * Sign in with Google using popup
   */
  static async signInWithGoogle(): Promise<GoogleAuthResult> {
    try {
      const result = await signInWithPopup(auth, this.provider);
      const user = result.user;

      // Get the ID token
      const idToken = await user.getIdToken();

      // Get the Google access token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken || null;

      return {
        user,
        idToken,
        accessToken,
      };
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // Handle specific errors
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled by user');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up blocked by browser. Please allow pop-ups and try again');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection and try again');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please try again later');
      }
      
      throw new Error('Google sign-in failed. Please try again');
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<void> {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Sign-out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  /**
   * Get the current user's ID token
   */
  static async getCurrentUserIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  /**
   * Check if user is currently signed in
   */
  static isSignedIn(): boolean {
    return !!auth.currentUser;
  }

  /**
   * Get current user info
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Listen to authentication state changes
   */
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return auth.onAuthStateChanged(callback);
  }
}