import React, { useState } from 'react';
import { signUpWithEmail } from '../services/firebaseService';
import Loader from './Loader';

interface RegisterScreenProps {
    onSwitchToLogin: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSwitchToLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Şifreler eşleşmiyor.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            await signUpWithEmail(email, password);
            setSuccessMessage("Kayıt başarılı! Giriş ekranına yönlendiriliyorsunuz...");
            setTimeout(() => {
                onSwitchToLogin();
            }, 3000);
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError("Bu e-posta adresi zaten kullanılıyor.");
            } else if (err.code === 'auth/weak-password') {
                setError("Şifre en az 6 karakter olmalıdır.");
            } else {
                setError("Bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
            <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700">
                <h1 className="text-3xl font-bold text-center mb-2 text-cyan-400">Kayıt Ol</h1>
                <p className="text-gray-400 text-center mb-6">Yeni bir hesap oluşturun.</p>
                <form onSubmit={handleRegister}>
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
                    <div className="mb-4">
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
                     <div className="mb-6">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="confirm-password">
                            Şifreyi Onayla
                        </label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="shadow-inner appearance-none border border-gray-600 rounded w-full py-3 px-4 bg-gray-700 text-gray-200 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            required
                        />
                    </div>
                    {error && (
                        <p className="bg-red-900/50 text-red-300 p-3 rounded-md mb-4 text-center text-sm">{error}</p>
                    )}
                     {successMessage && (
                        <p className="bg-green-900/50 text-green-300 p-3 rounded-md mb-4 text-center text-sm">{successMessage}</p>
                    )}
                    <div className="flex items-center justify-center mb-4">
                        <button
                            type="submit"
                            disabled={isLoading || !!successMessage}
                            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {isLoading ? <Loader /> : 'Kayıt Ol'}
                        </button>
                    </div>
                     <div className="text-center">
                        <button type="button" onClick={onSwitchToLogin} className="text-sm text-cyan-400 hover:text-cyan-300">
                            Zaten bir hesabınız var mı? Giriş Yapın
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterScreen;