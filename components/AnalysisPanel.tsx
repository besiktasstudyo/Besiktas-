
import React from 'react';
import type { AnalysisResult, AnalysisDetail } from '../types';

interface AnalysisPanelProps {
    analysisResult: AnalysisResult | null;
    isAnalyzing: boolean;
}

const AnalysisCard: React.FC<{ title: string; detail: AnalysisDetail }> = ({ title, detail }) => {
    const getStatusClass = (status: AnalysisDetail['status']) => {
        switch (status) {
            case 'İyi': return 'text-green-400';
            case 'Dikkat': return 'text-yellow-400';
            case 'Veri Yetersiz': return 'text-gray-500';
            default: return '';
        }
    };

    return (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 p-4 rounded-lg">
            <h3 className="font-semibold text-lg text-cyan-400">{title}</h3>
            <p className={getStatusClass(detail.status)}>{detail.text}</p>
        </div>
    );
};


const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysisResult, isAnalyzing }) => {
    const score = analysisResult?.postureScore100;
    
    let scoreColorClass = 'text-gray-500';
    let scoreBgClass = 'bg-gray-900/30';
    if (score !== null && score !== undefined) {
        if (score < 50) { scoreColorClass = 'text-red-400'; scoreBgClass = 'bg-red-900/50'; }
        else if (score < 80) { scoreColorClass = 'text-yellow-400'; scoreBgClass = 'bg-yellow-900/50'; }
        else { scoreColorClass = 'text-green-400'; scoreBgClass = 'bg-green-900/50'; }
    }

    const renderContent = () => {
        if (!isAnalyzing) {
            return (
                <div className="text-gray-400 text-center py-8">
                    Analizi başlatmak için 'Analizi Başlat' düğmesine tıklayın.
                </div>
            );
        }
        if (analysisResult) {
            return (
                <>
                    <AnalysisCard title="Baş Duruşu" detail={analysisResult.head} />
                    <AnalysisCard title="Omuz Seviyesi" detail={analysisResult.shoulders} />
                    <AnalysisCard title="Omurga Hizalaması (Önden)" detail={analysisResult.spine} />
                    <AnalysisCard title="Kalça Seviyesi" detail={analysisResult.hips} />
                    <AnalysisCard title="Diz Hizalaması" detail={analysisResult.knees} />
                </>
            );
        }
        return (
            <div className="text-gray-400 text-center py-16">
                Kimse algılanmadı. Lütfen kameranın karşısına geçin.
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-cyan-500 pb-2">Anlık Analiz Sonuçları</h2>
            
            <div className={`text-center mb-4 p-4 rounded-lg transition-colors duration-300 ${scoreBgClass}`}>
                 <span className="text-lg font-semibold text-gray-400">POSTÜR PUANI</span>
                 <p className={`text-6xl font-bold transition-colors duration-300 ${scoreColorClass}`}>{score ?? '--'}</p>
            </div>
            
            <div className="space-y-4 overflow-y-auto pr-2 flex-grow">
                {renderContent()}
            </div>

            <div className="mt-auto pt-4">
                <div className="bg-yellow-900/70 border-l-4 border-yellow-500 text-yellow-100 p-4 rounded-lg" role="alert">
                    <p className="font-bold">Önemli Uyarı</p>
                    <p>Bu araç tıbbi bir teşhis sağlamaz. Sadece bilgilendirme ve farkındalık amaçlıdır.</p>
                </div>
            </div>
        </div>
    );
};

export default AnalysisPanel;
