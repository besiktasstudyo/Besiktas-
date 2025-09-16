
import React from 'react';
import type { AnalysisThresholds } from '../types';
import { DEFAULT_THRESHOLDS } from '../constants';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    thresholds: AnalysisThresholds;
    onThresholdsChange: (newThresholds: AnalysisThresholds) => void;
}

interface SliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ThresholdSlider: React.FC<SliderProps> = ({ label, value, min, max, step, unit, onChange }) => (
    <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
            <label className="text-gray-300">{label}</label>
            <span className="font-mono text-cyan-400 bg-gray-900 px-2 py-1 rounded-md">{value}{unit}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
    </div>
);


const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, thresholds, onThresholdsChange }) => {
    if (!isOpen) return null;

    const handleChange = (key: keyof AnalysisThresholds) => (e: React.ChangeEvent<HTMLInputElement>) => {
        onThresholdsChange({
            ...thresholds,
            [key]: Number(e.target.value)
        });
    };
    
    const handleReset = () => {
        onThresholdsChange(DEFAULT_THRESHOLDS);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col border border-gray-600">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-cyan-400">Hassasiyet Ayarları</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6 text-gray-300">
                    <p className="text-sm text-gray-400">
                        Bu ayarlar, duruş bozukluklarının ne kadar hassas bir şekilde tespit edileceğini kontrol eder.
                        Değerleri düşürmek tespiti daha hassas hale getirir.
                    </p>
                    <ThresholdSlider 
                        label="Baş İleri Duruş Toleransı"
                        value={thresholds.headForward}
                        onChange={handleChange('headForward')}
                        min={0} max={50} step={1} unit="px"
                    />
                    <ThresholdSlider 
                        label="Baş Geri Duruş Toleransı"
                        value={thresholds.headBackward}
                        onChange={handleChange('headBackward')}
                        min={0} max={50} step={1} unit="px"
                    />
                    <ThresholdSlider 
                        label="Omuz Asimetri Toleransı"
                        value={thresholds.shoulderTilt}
                        onChange={handleChange('shoulderTilt')}
                        min={0} max={20} step={0.5} unit="%"
                    />
                     <ThresholdSlider 
                        label="Omurga Kayma Toleransı"
                        value={thresholds.spineDeviation}
                        onChange={handleChange('spineDeviation')}
                        min={0} max={25} step={0.5} unit="%"
                    />
                    <ThresholdSlider 
                        label="Kalça Asimetri Toleransı"
                        value={thresholds.hipTilt}
                        onChange={handleChange('hipTilt')}
                        min={0} max={20} step={0.5} unit="%"
                    />
                    <ThresholdSlider 
                        label="Diz Kayma Toleransı"
                        value={thresholds.kneeDeviation}
                        onChange={handleChange('kneeDeviation')}
                        min={0} max={20} step={0.5} unit="%"
                    />
                </div>
                <div className="flex justify-between items-center p-4 border-t border-gray-700 gap-4">
                    <button onClick={handleReset} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-5 rounded-lg transition">
                       Varsayılana Sıfırla
                    </button>
                    <button onClick={onClose} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-5 rounded-lg transition">
                       Kapat
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
