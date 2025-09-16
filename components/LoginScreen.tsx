import React, { useState } from 'react';
import { signInWithEmail, getUserProfile, updateUserSession } from '../services/firebaseService';
import Loader from './Loader';

interface LoginScreenProps {
    onSwitchToRegister: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSwitchToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const userCredential = await signInWithEmail(email, password);
            const user = userCredential.user;

            if (!user) {
                throw new Error("Giriş başarısız oldu, kullanıcı bulunamadı.");
            }

            const userProfile = await getUserProfile(user.uid);
            if (!userProfile) {
                throw new Error("Kullanıcı profili bulunamadı. Lütfen yöneticinizle iletişime geçin.");
            }
            
            const subEndDate = userProfile.subscriptionEndDate instanceof Date 
                ? userProfile.subscriptionEndDate 
                : new Date(userProfile.subscriptionEndDate.seconds * 1000);

            if (new Date() > subEndDate) {
                throw new Error("Aboneliğinizin süresi dolmuş. Lütfen yenilemek için yöneticinizle iletişime geçin.");
            }

            const sessionToken = Date.now().toString(36) + Math.random().toString(36).substring(2);
            await updateUserSession(user.uid, sessionToken);
            localStorage.setItem('sessionToken', sessionToken);
            
            // onAuthChange dinleyicisi UI değişikliğini tetikleyecektir

        } catch (err: any) {
            console.error(err);
             if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError("E-posta veya şifre hatalı.");
            } else {
                setError(err.message || "Bilinmeyen bir hata oluştu.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
            <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700">
                <h1 className="text-3xl font-bold text-center mb-2 text-cyan-400">Giriş Yap</h1>
                <p className="text-gray-400 text-center mb-6">Postür Analiz Aracına hoş geldiniz.</p>
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                            E-posta
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="shadow-inner appearance-none border border-gray-600 rounded w-full py-3 px-4 bg-gray-700 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                            Şifre
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                             className="shadow-inner appearance-none border border-gray-600 rounded w-full py-3 px-4 bg-gray-700 text-gray-200 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            required
                        />
                    </div>
                    {error && (
                        <p className="bg-red-900/50 text-red-300 p-3 rounded-md mb-4 text-center text-sm">{error}</p>
                    )}
                    <div className="flex items-center justify-center mb-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {isLoading ? <Loader /> : 'Giriş Yap'}
                        </button>
                    </div>
                     <div className="text-center">
                        <button type="button" onClick={onSwitchToRegister} className="text-sm text-cyan-400 hover:text-cyan-300">
                            Hesabınız yok mu? Kayıt Olun
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;