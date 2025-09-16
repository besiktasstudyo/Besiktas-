
import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { Pose } from '../types';
import { KEYPOINTS, SKELETON } from '../constants';
import Loader from './Loader';
import { StartIcon, StopIcon, SwitchCameraIcon, ReportIcon, HistoryIcon } from './icons';

interface VideoPanelProps {
    detector: any | null;
    isLoadingModel: boolean;
    isAnalyzing: boolean;
    onStart: () => void;
    onStop: () => void;
    onPoseDetected: (pose: Pose | null) => void;
    onGenerateReport: () => void;
    onViewHistory: () => void;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    isUserLoggedIn: boolean;
}

const VideoPanel: React.FC<VideoPanelProps> = ({
    detector, isLoadingModel, isAnalyzing,
    onStart, onStop, onPoseDetected,
    onGenerateReport, onViewHistory, canvasRef, isUserLoggedIn
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [cameraError, setCameraError] = useState<string | null>(null);
    const animationFrameId = useRef<number>();
    
    // FIX: Replaced forEach with a for...of loop to resolve an obscure error.
    // This is a more robust way to iterate and stop media tracks.
    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const mediaStream = videoRef.current.srcObject as MediaStream;
            for (const track of mediaStream.getTracks()) {
                track.stop();
            }
            videoRef.current.srcObject = null;
        }
    }, []);

    const setupCamera = useCallback(async (mode: 'user' | 'environment') => {
        stopCamera();
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: mode, width: 480, height: 640 }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
        } catch (err) {
            console.error("Camera setup failed:", err);
            setCameraError("Kamera başlatılamadı. Lütfen tarayıcı izinlerini kontrol edin.");
        }
    }, [stopCamera]);

    const drawKeypoints = (ctx: CanvasRenderingContext2D, keypoints: Pose['keypoints']) => {
        ctx.fillStyle = '#34d399';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        for (const { x, y, score } of keypoints) {
            if (score > 0.4) {
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
            }
        }
    };

    const drawSkeleton = (ctx: CanvasRenderingContext2D, keypoints: Pose['keypoints']) => {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 3;
        SKELETON.forEach(([i, j]) => {
            const kp1 = keypoints[i];
            const kp2 = keypoints[j];
            if (kp1 && kp2 && kp1.score > 0.4 && kp2.score > 0.4) {
                ctx.beginPath();
                ctx.moveTo(kp1.x, kp1.y);
                ctx.lineTo(kp2.x, kp2.y);
                ctx.stroke();
            }
        });
    };

    const renderLoop = useCallback(async () => {
        if (!detector || !videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) {
            animationFrameId.current = requestAnimationFrame(renderLoop);
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const poses = await detector.estimatePoses(video, { flipHorizontal: false });
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (facingMode === 'user') {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-canvas.width, 0);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (facingMode === 'user') {
            ctx.restore();
        }

        if (poses.length > 0 && poses[0].keypoints.every((kp: any) => kp.score > 0.1)) {
            const keypoints = poses[0].keypoints.map((kp: any) => {
                let newX = kp.x;
                if(facingMode === 'user') {
                    newX = canvas.width - kp.x;
                }
                return {...kp, x: newX};
            });
            drawSkeleton(ctx, keypoints);
            drawKeypoints(ctx, keypoints);
            onPoseDetected({...poses[0], keypoints});
        } else {
            onPoseDetected(null);
        }
        
        animationFrameId.current = requestAnimationFrame(renderLoop);
    }, [detector, canvasRef, onPoseDetected, facingMode]);
    
    useEffect(() => {
        if (isAnalyzing) {
            setupCamera(facingMode);
            animationFrameId.current = requestAnimationFrame(renderLoop);
        } else {
            stopCamera();
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        }
        return () => {
            stopCamera();
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAnalyzing]);
    
    useEffect(() => {
        if (isAnalyzing) {
            setupCamera(facingMode);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facingMode]);

    const handleStartClick = async () => {
        await setupCamera(facingMode);
        if (!cameraError) {
            onStart();
        }
    };
    
    const handleSwitchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="flex-1 flex flex-col items-center bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
            <h1 className="text-3xl font-bold text-center mb-2 text-cyan-400">Gelişmiş Postür Analiz Aracı</h1>
            <p className="text-gray-400 text-center mb-4">Bulut tabanlı depolama ile duruşunuzu analiz edin ve gelişiminizi takip edin.</p>

            <div className="relative w-full max-w-md aspect-[3/4] bg-black rounded-lg overflow-hidden shadow-inner">
                <video ref={videoRef} className="hidden" playsInline muted></video>
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full"></canvas>
                {(isLoadingModel || cameraError) && (
                    <div className="absolute inset-0 flex flex-col justify-center items-center bg-black bg-opacity-70 text-center p-4">
                        {isLoadingModel ? (
                            <>
                                <Loader />
                                <p className="mt-4 text-lg">Model Yükleniyor...</p>
                            </>
                        ) : (
                           cameraError && <p className="text-red-500">{cameraError}</p>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-6 grid grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-md">
                <button onClick={handleStartClick} disabled={isLoadingModel || isAnalyzing} className="col-span-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed">
                    <StartIcon /> Analizi Başlat
                </button>
                <button onClick={onStop} disabled={!isAnalyzing} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-500">
                   <StopIcon /> Durdur
                </button>
                <button onClick={handleSwitchCamera} disabled={!isAnalyzing} className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-500">
                    <SwitchCameraIcon /> Kamera Değiştir
                </button>
                <button onClick={onGenerateReport} disabled={!isAnalyzing} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-500">
                    <ReportIcon /> Rapor Oluştur
                </button>
                <button onClick={onViewHistory} disabled={!isUserLoggedIn || isAnalyzing} className="col-span-full lg:col-span-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed">
                   <HistoryIcon /> Geçmişi Görüntüle
                </button>
            </div>
        </div>
    );
};

export default VideoPanel;
