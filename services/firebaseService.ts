import type { HistoryEntry, UserProfile } from '../types';

declare const firebase: any;

let auth: any;
let db: any;
let appProjectId: string | undefined;

// TODO: Bu yapılandırmayı kendi Firebase proje bilgilerinizle değiştirin.
// Firebase konsolunuzda Proje Ayarları > Genel bölümünde bulabilirsiniz.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export const initFirebase = (): boolean => {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY" || !firebaseConfig.projectId || firebaseConfig.projectId === "YOUR_PROJECT_ID") {
        // Yapılandırma eksikse, konsola hata yazdırmak yerine sessizce başarısız ol.
        // Bu, uygulamanın misafir modunda açılmasına izin verir.
        return false;
    }
    
    appProjectId = firebaseConfig.projectId;

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    auth = firebase.auth();
    db = firebase.firestore();
    return true;
};

export const onAuthChange = (callback: (user: any | null) => void) => {
    return auth.onAuthStateChanged(callback);
};

export const signInWithEmail = (email: string, password: string): Promise<any> => {
    return auth.signInWithEmailAndPassword(email, password);
};

export const signUpWithEmail = async (email: string, password: string): Promise<void> => {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    if (!user) {
        throw new Error("Kullanıcı oluşturulamadı.");
    }

    // Firestore'da bir kullanıcı profili belgesi oluştur
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);

    const userProfile = {
        email: user.email,
        subscriptionEndDate: firebase.firestore.Timestamp.fromDate(subscriptionEndDate),
        activeSessionToken: null
    };

    await getUserDocRef(user.uid).set(userProfile);
};

export const signOutUser = async () => {
    const user = auth.currentUser;
    if (user) {
        // Oturumu kapatmadan önce Firestore'daki oturum anahtarını temizle
        await getUserDocRef(user.uid).update({ activeSessionToken: null });
    }
    localStorage.removeItem('sessionToken');
    return auth.signOut();
};

const getUserDocRef = (userId: string) => {
    return db.collection('users').doc(userId);
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const docSnap = await getUserDocRef(userId).get();
    if (docSnap.exists) {
        const data = docSnap.data();
        return {
            ...data,
            subscriptionEndDate: data.subscriptionEndDate ? data.subscriptionEndDate.toDate() : new Date(0),
        } as UserProfile;
    }
    return null;
};

export const updateUserSession = (userId: string, token: string | null) => {
    return getUserDocRef(userId).set({ activeSessionToken: token }, { merge: true });
};

export const onSessionActivity = (userId: string, currentToken: string, onHijack: () => void) => {
    const docRef = getUserDocRef(userId);
    // onSnapshot dinleyiciden çıkmak için fonksiyonu döndürür
    return docRef.onSnapshot((doc: any) => {
        const data = doc.data();
        if (data && data.activeSessionToken && data.activeSessionToken !== currentToken) {
            onHijack();
        }
    });
};

const getHistoryCollection = (userId: string) => {
    const collectionId = appProjectId || 'posture-analyzer-app';
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
            createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        } as HistoryEntry;
    });
};