// Utility function to map P1/P2/P3/P4 to High/Medium/Low
export function mapSeverityToLabel(severity: string): string {
    const normalized = severity.toUpperCase();
    switch (normalized) {
        case 'P1':
        case 'CRITICAL':
            return 'High';
        case 'P2':
        case 'HIGH':
            return 'Medium';  // P2 maps to Medium
        case 'P3':
        case 'MEDIUM':
            return 'Low';     // P3 maps to Low
        case 'P4':
        case 'LOW':
            return 'Low';
        default:
            return severity;
    }
}

// Get severity label from incident (prefers AI recommendation)
export function getIncidentSeverityLabel(incident: any): string {
    const severity = incident.aiHealthSummary?.recommendedSeverity || incident.severity;
    return mapSeverityToLabel(severity);
}
