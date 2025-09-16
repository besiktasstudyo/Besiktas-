// FIX: Removed Firebase v9 types (Auth, Firestore) that are incompatible with the v8 namespaced API (`firebase.*`) being used.
import type { User } from 'firebase/auth';
import type { HistoryEntry } from '../types';

// Access firebase from the window object
declare const firebase: any;

// FIX: Changed types to `any` to match the v8 API provided by the global `firebase` object.
let auth: any;
let db: any;
let appProjectId: string | undefined;

export const initFirebase = () => {
    // FIX: Switched from reading a single `window.__firebase_config` object to
    // reading individual Firebase config values from `process.env`, which is a
    // more standard and robust way to handle environment-specific configuration.
    const firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
    };

    // Store for later use in getHistoryCollection
    appProjectId = firebaseConfig.projectId;

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        throw new Error("Firebase configuration is incomplete. Please check your environment variables.");
    }

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    auth = firebase.auth();
    db = firebase.firestore();
};

export const onAuthChange = (callback: (user: User | null) => void) => {
    return auth.onAuthStateChanged(callback);
};

export const signIn = async () => {
    try {
        // FIX: Simplified authentication to only use anonymous sign-in, removing
        // the dependency on `window.__initial_auth_token` which was causing errors.
        await auth.signInAnonymously();
    } catch (error) {
        console.error("Authentication failed: ", error);
    }
};

const getHistoryCollection = (userId: string) => {
    // FIX: Replaced dependency on `window.__app_id` with the `projectId` from the
    // Firebase config to make the database path consistent and independent of window injection.
    const collectionId = appProjectId || 'posture-analyzer-app'; // Fallback just in case
    return db.collection('artifacts').doc(collectionId).collection('users').doc(userId).collection('history');
};

export const saveReport = async (userId: string, reportData: Omit<HistoryEntry, 'createdAt' | 'id'>) => {
    const historyCollection = getHistoryCollection(userId);
    const newEntry = {
        ...reportData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    return await historyCollection.add(newEntry);
};

export const fetchHistory = async (userId: string): Promise<HistoryEntry[]> => {
    const historyCollection = getHistoryCollection(userId);
    const q = historyCollection.orderBy('createdAt', 'desc');
    const querySnapshot = await q.get();
    
    return querySnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            // Firestore timestamps need to be converted to JS Dates
            createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        } as HistoryEntry;
    });
};
