
import React, { useState, useEffect, useRef } from 'react';
import type { HistoryEntry, AnalysisDetail } from '../types';
import { fetchHistory } from '../services/firebaseService';
import Loader from './Loader';

// To access Chart.js from window
declare const Chart: any;

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string | undefined;
}

const METRIC_CONFIG: { [key in keyof Omit<HistoryEntry, 'id' | 'createdAt' | 'reportText' | 'snapshotImage' | 'postureScore100'>]: { label: string; color: string } } = {
    head: { label: 'Baş Duruşu', color: '#22d3ee' },      // cyan-400
    shoulders: { label: 'Omuz Seviyesi', color: '#a78bfa' }, // violet-400
    spine: { label: 'Omurga Hizası', color: '#4ade80' },  // green-400
    hips: { label: 'Kalça Seviyesi', color: '#facc15' },   // yellow-400
    knees: { label: 'Diz Hizası', color: '#f472b6' },      // pink-400
};

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, userId }) => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (isOpen && userId) {
            setIsLoading(true);
            setSelectedEntry(null);
            fetchHistory(userId).then(data => {
                setHistory(data);
                setIsLoading(false);
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, userId]);

    useEffect(() => {
        if (history.length > 0 && chartRef.current) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
            const sortedHistory = [...history].reverse();
            const labels = sortedHistory.map(e => {
                const date = e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt.seconds * 1000);
                return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
            });
            
            const datasets = Object.keys(METRIC_CONFIG).map(key => {
                const metricKey = key as keyof typeof METRIC_CONFIG;
                return {
                    label: METRIC_CONFIG[metricKey].label,
                    data: sortedHistory.map(e => (e[metricKey] as AnalysisDetail)?.score ?? 0),
                    borderColor: METRIC_CONFIG[metricKey].color,
                    backgroundColor: `${METRIC_CONFIG[metricKey].color}33`, // Add alpha for fill
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointBackgroundColor: METRIC_CONFIG[metricKey].color,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                };
            });
            
            const ctx = chartRef.current.getContext('2d');
            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: { labels, datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 1000,
                        easing: 'easeInOutQuart',
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    scales: {
                        y: {
                            min: 0,
                            max: 2,
                            ticks: {
                                color: '#9ca3af',
                                stepSize: 1,
                                callback: function(value: number) {
                                    if (value === 2) return 'İyi';
                                    if (value === 1) return 'Dikkat';
                                    if (value === 0) return 'Veri Yetersiz';
                                    return '';
                                }
                            },
                            grid: { color: 'rgba(156, 163, 175, 0.2)' }
                        },
                        x: {
                            ticks: { color: '#9ca3af' },
                            grid: { color: 'rgba(156, 163, 175, 0.1)' }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#d1d5db', usePointStyle: true, boxWidth: 8 }
                        },
                        tooltip: {
                            backgroundColor: 'rgb(17, 24, 39)',
                            titleColor: '#d1d5db',
                            bodyColor: '#d1d5db',
                            borderWidth: 1,
                            borderColor: '#374151',
                            usePointStyle: true,
                            boxPadding: 4,
                            callbacks: {
                                label: function(context: any) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    const value = context.parsed.y;
                                    if (value === 2) label += 'İyi';
                                    else if (value === 1) label += 'Dikkat';
                                    else label += 'Veri Yetersiz';
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        }
    }, [history]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-gray-600">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-cyan-400">Analiz Geçmişi ve İlerleme</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto flex flex-col md:flex-row gap-6">
                    {isLoading ? (
                        <div className="w-full flex justify-center items-center h-96"><Loader /></div>
                    ) : (
                        <>
                            <div className="w-full md:w-1/3">
                                <h3 className="font-bold mb-2">Kayıtlı Analizler ({history.length})</h3>
                                <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
                                    {history.length > 0 ? history.map(entry => {
                                        const date = entry.createdAt instanceof Date ? entry.createdAt : new Date(entry.createdAt.seconds * 1000);
                                        return (
                                            <button key={entry.id} onClick={() => setSelectedEntry(entry)} className={`w-full text-left p-3 bg-gray-700 hover:bg-cyan-700 rounded-lg transition ${selectedEntry?.id === entry.id ? 'bg-cyan-600 shadow-lg' : ''}`}>
                                                <div className="flex justify-between items-center">
                                                    <span>{date.toLocaleString('tr-TR')}</span>
                                                    <span className="font-bold text-cyan-300">Puan: {entry.postureScore100}</span>
                                                </div>
                                            </button>
                                        );
                                    }) : <p className="text-gray-400">Henüz kayıtlı analiz yok.</p>}
                                </div>
                            </div>
                            <div className="w-full md:w-2/3">
                                <h3 className="font-bold mb-4 text-center text-lg">Metriklerin Zaman İçindeki Değişimi</h3>
                                <div className="mb-6 h-80 relative"><canvas ref={chartRef}></canvas></div>
                                {selectedEntry ? (
                                    <div className="animate-fade-in">
                                        <h4 className="font-bold mb-2 text-cyan-400">Seçili Rapor Detayları</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <img src={selectedEntry.snapshotImage} className="w-full rounded-lg border border-gray-600" alt="Analiz Anı Görüntüsü"/>
                                            <pre className="whitespace-pre-wrap text-sm bg-gray-900 p-4 rounded-lg font-mono h-full max-h-60 md:max-h-full overflow-auto">{selectedEntry.reportText}</pre>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-400 text-center py-16">
                                        Grafik metriklerini inceleyin veya ayrıntılar için listeden bir kayıt seçin.
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;
