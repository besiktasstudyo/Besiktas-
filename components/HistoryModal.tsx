
import React, { useState, useEffect, useRef } from 'react';
import type { HistoryEntry } from '../types';
import { fetchHistory } from '../services/firebaseService';
import Loader from './Loader';

// To access Chart.js from window
declare const Chart: any;

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string | undefined;
}

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
                return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
            });
            const data = sortedHistory.map(e => e.postureScore100);
            
            const ctx = chartRef.current.getContext('2d');
            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Postür Puanı (Max 100)', data,
                        borderColor: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.2)',
                        fill: true, tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, max: 100, ticks: { color: '#9ca3af' } },
                        x: { ticks: { color: '#9ca3af' } }
                    },
                    plugins: { legend: { labels: { color: '#9ca3af' } } }
                }
            });
        }
    }, [history]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-600">
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
                                <h3 className="font-bold mb-2">Kayıtlı Analizler</h3>
                                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                    {history.length > 0 ? history.map(entry => {
                                        const date = entry.createdAt instanceof Date ? entry.createdAt : new Date(entry.createdAt.seconds * 1000);
                                        return (
                                            <button key={entry.id} onClick={() => setSelectedEntry(entry)} className={`w-full text-left p-3 bg-gray-700 hover:bg-cyan-700 rounded-lg transition ${selectedEntry?.id === entry.id ? 'bg-cyan-600' : ''}`}>
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
                                <div className="mb-6 h-64"><canvas ref={chartRef}></canvas></div>
                                {selectedEntry ? (
                                    <div>
                                        <img src={selectedEntry.snapshotImage} className="w-full rounded-lg mb-4 border border-gray-600" alt="Analiz Anı Görüntüsü"/>
                                        <pre className="whitespace-pre-wrap text-sm bg-gray-900 p-4 rounded-lg font-mono max-h-60 overflow-auto">{selectedEntry.reportText}</pre>
                                    </div>
                                ) : (
                                    <div className="text-gray-400 text-center py-16">
                                        İncelemek için listeden bir analiz kaydı seçin.
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
