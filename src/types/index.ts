export type Severity = 'P1' | 'P2' | 'P3';

export interface Incident {
    id: string;
    service: string;
    severity: Severity;
    summary: string;
    timestamp: string;
    source: string;
    status: string;
    rawContent?: string;
    appName?: string;
    object?: string;
    environment?: string;
    importance?: string;
    observabilityData?: {
        status?: string;
        lastCheckTime?: string;
        version?: string;
        deployedAt?: string;
        deployedBy?: string;
        changeSummary?: string;
        smoke?: string;
    };
    aiHealthSummary?: {
        statusSection: string;
        deploymentSection: string;
        smokeSection: string;
        conclusion: string;
        recommendedSeverity?: string;
    };
    flowName?: string;
    errorMessage?: string;
}

export interface Hypothesis {
    id: string;
    title: string;
    explanation: string;
    confidence: number; // 0-100
}

export interface RunbookStep {
    id: string;
    description: string;
    toolToCall?: string;
    toolResult?: string;
}

export interface Runbook {
    incidentSummary: string;
    hypotheses: Hypothesis[];
    steps: RunbookStep[];
}

export interface IncidentAnalysisResponse {
    incidents: Incident[];
    topIncidentService: string;
    runbook: Runbook;
}
