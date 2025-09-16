import React, { useState, useEffect } from 'react';
import { initFirebase, onAuthChange } from './services/firebaseService';
import PostureAnalyzer from './PostureAnalyzer';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import FullScreenLoader from './components/FullScreenLoader';

const App: React.FC = () => {
    const [user, setUser] = useState<any | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
    const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
    const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');

    useEffect(() => {
        const isInitialized = initFirebase();
        if (isInitialized) {
            const unsubscribe = onAuthChange((currentUser) => {
                setUser(currentUser);
                setIsAuthLoading(false);
            });
            return () => unsubscribe();
        } else {
            // Firebase başlatılamadı, misafir modunu etkinleştir.
            setIsGuestMode(true);
            setIsAuthLoading(false);
        }
    }, []);

    if (isAuthLoading) {
        return <FullScreenLoader />;
    }
    
    if (isGuestMode) {
        return <PostureAnalyzer user={null} />;
    }

    if (user) {
        return <PostureAnalyzer user={user} />;
    }

    if (authScreen === 'login') {
        return <LoginScreen onSwitchToRegister={() => setAuthScreen('register')} />;
    } else {
        return <RegisterScreen onSwitchToLogin={() => setAuthScreen('login')} />;
    }
};

export default App;