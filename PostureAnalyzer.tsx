
import React, { useState, useEffect, useRef, useCallback } from 'react';
import VideoPanel from './components/VideoPanel';
import AnalysisPanel from './components/AnalysisPanel';
import ReportModal from './components/ReportModal';
import HistoryModal from './components/HistoryModal';
import SettingsModal from './components/SettingsModal';
import ProfileModal from './components/ProfileModal';
import { signOutUser, onSessionActivity } from './services/firebaseService';
import type { AnalysisResult, Pose, AnalysisThresholds } from './types';
import { analyzePose } from './services/analysisService';
import { DEFAULT_THRESHOLDS } from './constants';

// To access pose-detection library from window
declare const poseDetection: any;

interface PostureAnalyzerProps {
    user: any | null; // User can be null for guest mode
}

const PostureAnalyzer: React.FC<PostureAnalyzerProps> = ({ user }) => {
    const [detector, setDetector] = useState<any | null>(null);
    const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null);
    const [isReportModalOpen, setReportModalOpen] = useState<boolean>(false);
    const [isHistoryModalOpen, setHistoryModalOpen] = useState<boolean>(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
    const [isProfileModalOpen, setProfileModalOpen] = useState<boolean>(false);

    const [thresholds, setThresholds] = useState<AnalysisThresholds>(() => {
        try {
            const savedThresholds = localStorage.getItem('postureAnalysisThresholds');
            return savedThresholds ? JSON.parse(savedThresholds) : DEFAULT_THRESHOLDS;
        } catch (error) {
            console.error("Failed to load thresholds from localStorage", error);
            return DEFAULT_THRESHOLDS;
        }
    });

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const loadModel = async () => {
            try {
                const model = poseDetection.SupportedModels.MoveNet;
                const loadedDetector = await poseDetection.createDetector(model, { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING });
                setDetector(loadedDetector);
            } catch (error) {
                console.error("Failed to load model:", error);
                alert("Error: Could not load the pose detection model. Please refresh the page.");
            } finally {
                setIsLoadingModel(false);
            }
        };
        loadModel();
    }, []);
    
    useEffect(() => {
        try {
            localStorage.setItem('postureAnalysisThresholds', JSON.stringify(thresholds));
        } catch (error) {
            console.error("Failed to save thresholds to localStorage", error);
        }
    }, [thresholds]);
    
    useEffect(() => {
        if (!user) return; // Do not check session for guest users

        const sessionToken = localStorage.getItem('sessionToken');
        if (!sessionToken) {
            signOutUser();
            return;
        }

        const unsubscribe = onSessionActivity(user.uid, sessionToken, () => {
            alert("Başka bir cihazda oturum açtığınız için bu oturum sonlandırıldı.");
            signOutUser();
        });

        return () => unsubscribe();
    }, [user]);

    const handlePoseDetected = useCallback((pose: Pose | null) => {
        if (pose) {
            const analysis = analyzePose(pose.keypoints, thresholds);
            setLatestAnalysis(analysis);
        } else {
            setLatestAnalysis(null);
        }
    }, [thresholds]);
    
    const handleStart = () => setIsAnalyzing(true);
    const handleStop = () => {
        setIsAnalyzing(false);
        setLatestAnalysis(null);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <main className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
                <VideoPanel
                    detector={detector}
                    isLoadingModel={isLoadingModel}
                    isAnalyzing={isAnalyzing}
                    onStart={handleStart}
                    onStop={handleStop}
                    onPoseDetected={handlePoseDetected}
                    onGenerateReport={() => setReportModalOpen(true)}
                    onViewHistory={() => setHistoryModalOpen(true)}
                    onOpenSettings={() => setSettingsModalOpen(true)}
                    onOpenProfile={() => setProfileModalOpen(true)}
                    onLogout={signOutUser}
                    canvasRef={canvasRef}
                    isUserLoggedIn={!!user}
                />
                <AnalysisPanel analysisResult={latestAnalysis} isAnalyzing={isAnalyzing} />
            </main>
            <footer className="text-center text-xs text-gray-600 p-4 w-full">
                {user ? `Kullanıcı: ${user.email}` : <span className="font-semibold text-cyan-400">Misafir Modu</span>}
            </footer>

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setReportModalOpen(false)}
                analysisResult={latestAnalysis}
                snapshotCanvas={canvasRef.current}
                userId={user?.uid}
            />

            <HistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setHistoryModalOpen(false)}
                userId={user?.uid}
            />

            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
                thresholds={thresholds}
                onThresholdsChange={setThresholds}
            />

            {user && <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                user={user}
            />}
        </div>
    );
};

export default PostureAnalyzer;