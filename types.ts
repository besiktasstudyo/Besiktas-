
export interface Keypoint {
    x: number;
    y: number;
    score: number;
    name?: string;
}

export interface Pose {
    keypoints: Keypoint[];
    score: number;
}

export interface AnalysisDetail {
    status: 'İyi' | 'Dikkat' | 'Veri Yetersiz';
    text: string;
    score: number;
}

export interface AnalysisResult {
    postureScore100: number;
    head: AnalysisDetail;
    shoulders: AnalysisDetail;
    spine: AnalysisDetail;
    hips: AnalysisDetail;
    knees: AnalysisDetail;
}

export interface HistoryEntry extends AnalysisResult {
    id?: string;
    createdAt: {
        seconds: number;
        nanoseconds: number;
    } | Date;
    reportText: string;
    snapshotImage: string;
}

export interface AnalysisThresholds {
    headForward: number;
    headBackward: number;
    shoulderTilt: number;
    spineDeviation: number;
    hipTilt: number;
    kneeDeviation: number;
}

export interface UserProfile {
    email: string;
    subscriptionEndDate: {
        seconds: number;
        nanoseconds: number;
    } | Date;
    activeSessionToken?: string;
}
