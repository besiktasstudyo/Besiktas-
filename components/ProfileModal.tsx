import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { getUserProfile } from '../services/firebaseService';
import Loader from './Loader';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen && user?.uid) {
            setIsLoading(true);
            getUserProfile(user.uid)
                .then(userProfile => {
                    setProfile(userProfile);
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error("Failed to fetch user profile:", error);
                    setIsLoading(false);
                });
        }
    }, [isOpen, user]);

    if (!isOpen) return null;
    
    const subscriptionEndDate = profile?.subscriptionEndDate instanceof Date
        ? profile.subscriptionEndDate
        : new Date(0);

    const formattedDate = subscriptionEndDate.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col border border-gray-600">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-cyan-400">Kullanıcı Profili</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto text-gray-300">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-32">
                            <Loader />
                        </div>
                    ) : profile ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-gray-400">E-posta Adresi</label>
                                <p className="text-lg bg-gray-900 p-3 rounded-md mt-1">{profile.email}</p>
                            </div>
                             <div>
                                <label className="text-sm font-bold text-gray-400">Abonelik Bitiş Tarihi</label>
                                <p className="text-lg bg-gray-900 p-3 rounded-md mt-1">{formattedDate}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-red-400">Kullanıcı profili bilgileri yüklenemedi.</p>
                    )}
                </div>
                 <div className="flex justify-end items-center p-4 border-t border-gray-700">
                    <button onClick={onClose} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-5 rounded-lg transition">
                       Kapat
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
