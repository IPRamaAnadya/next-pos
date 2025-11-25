import * as admin from 'firebase-admin';

/**
 * Firebase Admin SDK singleton instance
 * Initializes FCM for server-side push notifications
 */
class FirebaseAdminService {
  private static instance: FirebaseAdminService;
  private initialized: boolean = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): FirebaseAdminService {
    if (!FirebaseAdminService.instance) {
      FirebaseAdminService.instance = new FirebaseAdminService();
    }
    return FirebaseAdminService.instance;
  }

  private initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Check if already initialized
      if (admin.apps.length === 0) {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        
        if (!serviceAccount) {
          console.warn('FIREBASE_SERVICE_ACCOUNT_KEY not found in environment variables');
          return;
        }

        // Parse service account JSON
        const serviceAccountJSON = JSON.parse(serviceAccount);

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountJSON),
        });

        this.initialized = true;
        console.log('✅ Firebase Admin SDK initialized successfully');
      } else {
        this.initialized = true;
        console.log('✅ Firebase Admin SDK already initialized');
      }
    } catch (error) {
      console.error('❌ Error initializing Firebase Admin SDK:', error);
      throw error;
    }
  }

  public getMessaging() {
    if (!this.initialized) {
      throw new Error('Firebase Admin SDK is not initialized');
    }
    return admin.messaging();
  }

  public isInitialized(): boolean {
    return this.initialized;
  }
}

export const firebaseAdmin = FirebaseAdminService.getInstance();
