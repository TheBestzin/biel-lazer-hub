import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const config = {
  apiKey: import.meta.env["VITE_FIREBASE_API_KEY"] as string | undefined,
  authDomain: import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"] as string | undefined,
  projectId: import.meta.env["VITE_FIREBASE_PROJECT_ID"] as string | undefined,
  storageBucket: import.meta.env["VITE_FIREBASE_STORAGE_BUCKET"] as string | undefined,
  messagingSenderId: import.meta.env["VITE_FIREBASE_MESSAGING_SENDER_ID"] as string | undefined,
  appId: import.meta.env["VITE_FIREBASE_APP_ID"] as string | undefined,
  measurementId: import.meta.env["VITE_FIREBASE_MEASUREMENT_ID"] as string | undefined,
};

export const firebaseConfigurado = Boolean(config.apiKey && config.projectId && config.appId);

export const variaveisFirebaseFaltando = (
  [
    ["VITE_FIREBASE_API_KEY", config.apiKey],
    ["VITE_FIREBASE_AUTH_DOMAIN", config.authDomain],
    ["VITE_FIREBASE_PROJECT_ID", config.projectId],
    ["VITE_FIREBASE_STORAGE_BUCKET", config.storageBucket],
    ["VITE_FIREBASE_MESSAGING_SENDER_ID", config.messagingSenderId],
    ["VITE_FIREBASE_APP_ID", config.appId],
  ] as const
)
  .filter(([, valor]) => !valor)
  .map(([nome]) => nome);

let appRef: FirebaseApp | null = null;
let authRef: Auth | null = null;
let dbRef: Firestore | null = null;
let storageRef: FirebaseStorage | null = null;

function iniciar(): FirebaseApp {
  if (!firebaseConfigurado) {
    throw new Error(
      "Firebase não configurado. Defina as variáveis VITE_FIREBASE_* para conectar o sistema.",
    );
  }
  if (!appRef) {
    appRef = getApps().length
      ? getApp()
      : initializeApp({
          apiKey: config.apiKey!,
          authDomain: config.authDomain!,
          projectId: config.projectId!,
          storageBucket: config.storageBucket ?? "",
          messagingSenderId: config.messagingSenderId ?? "",
          appId: config.appId!,
          ...(config.measurementId ? { measurementId: config.measurementId } : {}),
        });
  }
  return appRef;
}

export function getFirebaseAuth(): Auth {
  if (!authRef) {
    authRef = getAuth(iniciar());
    void setPersistence(authRef, browserLocalPersistence);
  }
  return authRef;
}

export function getDb(): Firestore {
  if (!dbRef) dbRef = getFirestore(iniciar());
  return dbRef;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storageRef) storageRef = getStorage(iniciar());
  return storageRef;
}
