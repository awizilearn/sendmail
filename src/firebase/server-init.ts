import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeServerFirebase() {
  let firebaseApp: App;
  if (!getApps().length) {
    firebaseApp = initializeApp({
        projectId: firebaseConfig.projectId,
    });
  } else {
    firebaseApp = getApp();
  }

  return {
    firebaseApp,
    firestore: getFirestore(firebaseApp)
  };
}
