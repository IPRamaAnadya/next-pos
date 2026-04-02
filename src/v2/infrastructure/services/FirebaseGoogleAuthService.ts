import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { GoogleAuthService } from '../../domain/repositories/AuthRepository';
import { GoogleUser } from '../../domain/entities/GoogleUser';

export class FirebaseGoogleAuthService implements GoogleAuthService {
  private static instance: FirebaseGoogleAuthService;

  private constructor() {}

  public static getInstance(): FirebaseGoogleAuthService {
    if (!FirebaseGoogleAuthService.instance) {
      FirebaseGoogleAuthService.instance = new FirebaseGoogleAuthService();
    }
    return FirebaseGoogleAuthService.instance;
  }

  async verifyGoogleToken(idToken: string): Promise<GoogleUser> {
    try {
      // Create credential from the Google ID token
      const credential = GoogleAuthProvider.credential(idToken);
      
      // Sign in with the credential
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) {
        throw new Error('Failed to verify Google token');
      }

      // Extract access token if available
      const googleCredential = GoogleAuthProvider.credentialFromResult(userCredential);
      const accessToken = googleCredential?.accessToken;

      // Create GoogleUser entity
      return new GoogleUser(
        firebaseUser.uid,
        firebaseUser.email || '',
        firebaseUser.displayName,
        firebaseUser.photoURL,
        firebaseUser.emailVerified,
        'google.com',
        accessToken,
        idToken
      );
    } catch (error: any) {
      console.error('Error verifying Google token:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/invalid-credential') {
        throw new Error('Invalid Google authentication token');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error during Google authentication');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many authentication requests. Please try again later');
      }
      
      throw new Error('Google authentication failed');
    }
  }

  async signInWithGoogle(idToken: string): Promise<GoogleUser> {
    // This method is the same as verifyGoogleToken for our use case
    return await this.verifyGoogleToken(idToken);
  }

  async signOut(): Promise<void> {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw new Error('Failed to sign out');
    }
  }

  getCurrentUser(): GoogleUser | null {
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      return null;
    }

    return new GoogleUser(
      firebaseUser.uid,
      firebaseUser.email || '',
      firebaseUser.displayName,
      firebaseUser.photoURL,
      firebaseUser.emailVerified,
      'google.com'
    );
  }
}