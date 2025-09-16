
import React, { useState, useEffect } from 'react';
import type { AnalysisResult } from '../types';
import { generateReportText } from '../services/analysisService';
import { saveReport } from '../services/firebaseService';
import { CopyIcon, SaveIcon } from './icons';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    analysisResult: AnalysisResult | null;
    snapshotCanvas: HTMLCanvasElement | null;
    userId: string | undefined;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, analysisResult, snapshotCanvas, userId }) => {
    const [reportText, setReportText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('Raporu Kaydet');
    const [copyMessage, setCopyMessage] = useState('Raporu Kopyala');

    useEffect(() => {
        if (isOpen && analysisResult) {
            setReportText(generateReportText(analysisResult));
        } else if (isOpen) {
            setReportText("Rapor oluşturmak için vücudunuzun algılandığından emin olun.");
        }
    }, [isOpen, analysisResult]);

    if (!isOpen) return null;
    
    const handleCopy = () => {
        navigator.clipboard.writeText(reportText).then(() => {
            setCopyMessage('Kopyalandı!');
            setTimeout(() => setCopyMessage('Raporu Kopyala'), 2000);
        }).catch(err => {
            console.error('Copy failed', err);
            setCopyMessage('Hata!');
            setTimeout(() => setCopyMessage('Raporu Kopyala'), 2000);
        });
    };
    
    const handleSave = async () => {
        if (!userId || !analysisResult || !snapshotCanvas) return;
        setIsSaving(true);
        setSaveMessage('Kaydediliyor...');
        try {
            const snapshotImage = snapshotCanvas.toDataURL('image/png');
            await saveReport(userId, { ...analysisResult, reportText, snapshotImage });
            setSaveMessage('Kaydedildi!');
            setTimeout(() => {
                onClose();
                setSaveMessage('Raporu Kaydet');
                setIsSaving(false);
            }, 1000);
        } catch (error) {
            console.error("Failed to save report:", error);
            setSaveMessage('Kaydetme Başarısız');
             setTimeout(() => {
                setSaveMessage('Raporu Kaydet');
                setIsSaving(false);
            }, 2000);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-600">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-cyan-400">Postür Analiz Raporu</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto text-gray-300 whitespace-pre-wrap text-sm font-mono">
                    {reportText}
                </div>
                <div className="flex justify-end items-center p-4 border-t border-gray-700 gap-4">
                    <button onClick={handleCopy} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-5 rounded-lg transition">
                       <CopyIcon /> {copyMessage}
                    </button>
                    <button onClick={handleSave} disabled={!userId || !analysisResult || isSaving} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-5 rounded-lg transition disabled:bg-gray-500 disabled:cursor-not-allowed">
                       <SaveIcon /> {saveMessage}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportModal;
