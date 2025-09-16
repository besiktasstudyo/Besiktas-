
import type { User, Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { HistoryEntry } from '../types';

// Access firebase from the window object
declare const firebase: any;

let auth: Auth;
let db: Firestore;

export const initFirebase = () => {
    // These variables are expected to be injected into the window scope
    // by the execution environment, as per the original HTML file's logic.
    const firebaseConfig = (window as any).__firebase_config;
    if (!firebaseConfig) {
        throw new Error("Firebase config is not available on the window object.");
    }

    if (!firebase.apps.length) {
        firebase.initializeApp(JSON.parse(firebaseConfig));
    }
    
    auth = firebase.auth();
    db = firebase.firestore();
};

export const onAuthChange = (callback: (user: User | null) => void) => {
    return auth.onAuthStateChanged(callback);
};

export const signIn = async () => {
    // As per original code, try custom token first, then anonymous
    const initialAuthToken = (window as any).__initial_auth_token;
    try {
        if (initialAuthToken) {
            await auth.signInWithCustomToken(initialAuthToken);
        } else {
            await auth.signInAnonymously();
        }
    } catch (error) {
        console.error("Authentication failed: ", error);
        // Fallback to anonymous if custom token fails for any reason
        if (!auth.currentUser) {
            await auth.signInAnonymously();
        }
    }
};

const getHistoryCollection = (userId: string) => {
    const appId = (window as any).__app_id || 'posture-analyzer-app';
    return db.collection('artifacts').doc(appId).collection('users').doc(userId).collection('history');
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
