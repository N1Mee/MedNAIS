import * as firebaseAmin from 'firebase-admin';

let instance = firebaseAmin.apps[0]

// Initialize Firebase Admin SDK (optional)
if (!instance && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    
    if (serviceAccount.project_id) {
      instance = firebaseAmin.initializeApp({
        credential: firebaseAmin.credential.cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || serviceAccount.project_id,
      });
    } else {
      console.warn('Firebase Admin: Invalid service account configuration');
    }
  } catch (error) {
    console.warn('Firebase Admin initialization skipped:', error instanceof Error ? error.message : 'Unknown error');
  }
}

export const authAdmin = instance ? firebaseAmin.auth(instance) : null;
