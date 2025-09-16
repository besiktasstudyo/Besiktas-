
import { KEYPOINTS } from '../constants';
import type { Keypoint, AnalysisResult, AnalysisDetail } from '../types';

const analyzePart = (keypoints: Keypoint[], analysisFn: () => AnalysisDetail) => {
    return analysisFn();
};

export const analyzePose = (keypoints: Keypoint[]): AnalysisResult => {
    let totalScore = 0;
    let maxScore = 0;

    const createAnalysis = (fn: () => AnalysisDetail): AnalysisDetail => {
        const result = fn();
        maxScore += 2; // Each check has a max score of 2
        totalScore += result.score;
        return result;
    }

    const head = createAnalysis(() => {
        const lEar = keypoints[KEYPOINTS.left_ear];
        const lShoulder = keypoints[KEYPOINTS.left_shoulder];
        if (lEar.score < 0.4 || lShoulder.score < 0.4) return { status: 'Veri Yetersiz', text: 'Analiz için yan profil gerekli.', score: 0 };
        const headForwardness = lEar.x - lShoulder.x;
        if (headForwardness > 20) return { status: 'Dikkat', text: 'Başınız omuzlarınızın ilerisinde duruyor.', score: 1 };
        if (headForwardness < -10) return { status: 'Dikkat', text: 'Başınız geriye doğru aşırı eğik.', score: 1 };
        return { status: 'İyi', text: 'Başınız, omuzlarınızla iyi bir hizada.', score: 2 };
    });

    const shoulders = createAnalysis(() => {
        const lShoulder = keypoints[KEYPOINTS.left_shoulder];
        const rShoulder = keypoints[KEYPOINTS.right_shoulder];
        if (lShoulder.score < 0.4 || rShoulder.score < 0.4) return { status: 'Veri Yetersiz', text: 'Analiz için yeterli veri yok.', score: 0 };
        const tilt = Math.abs(lShoulder.y - rShoulder.y);
        const width = Math.abs(lShoulder.x - rShoulder.x);
        if (tilt > width * 0.05) {
            const higher = lShoulder.y < rShoulder.y ? 'Sol' : 'Sağ';
            return { status: 'Dikkat', text: `Omuzlarınızda asimetri mevcut. ${higher} omuz daha yukarıda.`, score: 1 };
        }
        return { status: 'İyi', text: 'Omuzlarınız dengeli ve aynı hizada.', score: 2 };
    });

    const spine = createAnalysis(() => {
        const lShoulder = keypoints[KEYPOINTS.left_shoulder];
        const rShoulder = keypoints[KEYPOINTS.right_shoulder];
        const lHip = keypoints[KEYPOINTS.left_hip];
        const rHip = keypoints[KEYPOINTS.right_hip];
        if ([lShoulder, rShoulder, lHip, rHip].some(kp => kp.score < 0.4)) return { status: 'Veri Yetersiz', text: 'Analiz için yeterli veri yok.', score: 0 };
        const shoulderMidX = (lShoulder.x + rShoulder.x) / 2;
        const hipMidX = (lHip.x + rHip.x) / 2;
        const deviation = Math.abs(shoulderMidX - hipMidX);
        const shoulderWidth = Math.abs(lShoulder.x - rShoulder.x);
        if (deviation > shoulderWidth * 0.1) return { status: 'Dikkat', text: 'Omuz ve kalça merkezinizde kayma var. Yanal eğriliğe işaret edebilir.', score: 1 };
        return { status: 'İyi', text: 'Omuzlarınız ve kalçalarınız dikey olarak iyi hizalanmış.', score: 2 };
    });
    
    const hips = createAnalysis(() => {
        const lHip = keypoints[KEYPOINTS.left_hip];
        const rHip = keypoints[KEYPOINTS.right_hip];
        if (lHip.score < 0.4 || rHip.score < 0.4) return { status: 'Veri Yetersiz', text: 'Analiz için yeterli veri yok.', score: 0 };
        const tilt = Math.abs(lHip.y - rHip.y);
        const width = Math.abs(lHip.x - rHip.x);
        if (tilt > width * 0.05) {
            const higher = lHip.y < rHip.y ? 'Sol' : 'Sağ';
            return { status: 'Dikkat', text: `Kalçalarınızda asimetri mevcut. ${higher} kalça daha yukarıda.`, score: 1 };
        }
        return { status: 'İyi', text: 'Kalçalarınız dengeli ve aynı hizada.', score: 2 };
    });
    
    const knees = createAnalysis(() => {
        const lKnee = keypoints[KEYPOINTS.left_knee];
        const lAnkle = keypoints[KEYPOINTS.left_ankle];
        const rKnee = keypoints[KEYPOINTS.right_knee];
        const rAnkle = keypoints[KEYPOINTS.right_ankle];
        if ([lKnee, lAnkle, rKnee, rAnkle].some(kp => kp.score < 0.4)) return { status: 'Veri Yetersiz', text: 'Analiz için yeterli veri yok.', score: 0 };
        const leftKneeInward = lKnee.x > lAnkle.x;
        const rightKneeInward = rKnee.x < rAnkle.x;
        const shoulderWidth = Math.abs(keypoints[KEYPOINTS.left_shoulder].x - keypoints[KEYPOINTS.right_shoulder].x);
        if ((leftKneeInward && Math.abs(lKnee.x - lAnkle.x) > shoulderWidth * 0.05) || (rightKneeInward && Math.abs(rKnee.x - rAnkle.x) > shoulderWidth * 0.05)) {
            return { status: 'Dikkat', text: 'Dizlerinizde içe doğru kayma (valgus) olabilir.', score: 1 };
        }
        return { status: 'İyi', text: 'Dizleriniz iyi hizalanmış görünüyor.', score: 2 };
    });
    
    const postureScore100 = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    
    return { postureScore100, head, shoulders, spine, hips, knees };
};

export const generateReportText = (analysisResult: AnalysisResult): string => {
    const { postureScore100, head, shoulders, spine, hips, knees } = analysisResult;
    const now = new Date();
    let report = `POSTÜR ANALİZ RAPORU\n--------------------------------\n`;
    report += `Tarih: ${now.toLocaleString('tr-TR')}\n`;
    report += `POSTÜR PUANI: ${postureScore100} / 100\n\nDEĞERLENDİRME\n--------------------------------\n\n`;
    if (head) report += `1. BAŞ DURUŞU: ${head.status} - ${head.text}\n`;
    if (shoulders) report += `2. OMUZ SEVİYESİ: ${shoulders.status} - ${shoulders.text}\n`;
    if (spine) report += `3. OMURGA HİZALAMASI: ${spine.status} - ${spine.text}\n`;
    if (hips) report += `4. KALÇA SEVİYESİ: ${hips.status} - ${hips.text}\n`;
    if (knees) report += `5. DİZ HİZALAMASI: ${knees.status} - ${knees.text}\n\n`;
    report += `UYARI: Bu rapor tıbbi bir teşhis sağlamaz.`;
    return report;
};
