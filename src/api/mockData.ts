import type { IncidentAnalysisResponse } from '../types';

export const MOCK_RESPONSE: IncidentAnalysisResponse = {
    incidents: [
        {
            id: '1',
            service: 'order-api',
            severity: 'P1',
            summary: 'High error rate in POST /orders',
            timestamp: new Date().toISOString(),
            source: 'Alerts mailbox',
            status: 'Investigating'
        },
        {
            id: '2',
            service: 'inventory-service',
            severity: 'P2',
            summary: 'Latency spike in database queries',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            source: 'DataDog',
            status: 'Open'
        },
        {
            id: '3',
            service: 'notification-service',
            severity: 'P3',
            summary: 'Email delivery delay',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            source: 'CloudWatch',
            status: 'Resolved'
        }
    ],
    topIncidentService: 'order-api',
    runbook: {
        incidentSummary: 'The order-api is experiencing a 15% increase in 500 errors starting at 14:00 UTC. Initial analysis suggests a potential database connection pool exhaustion.',
        hypotheses: [
            {
                id: 'h1',
                title: 'Database Connection Pool Exhaustion',
                explanation: 'The application is unable to acquire connections from the pool, leading to timeouts.',
                confidence: 85
            },
            {
                id: 'h2',
                title: 'Downstream Payment Gateway Failure',
                explanation: 'Dependent service payment-api is responding slowly, causing backpressure.',
                confidence: 40
            }
        ],
        steps: [
            {
                id: 's1',
                description: 'Check database connection pool metrics in CloudWatch.',
                toolToCall: 'get_db_metrics',
                toolResult: 'Pool utilization > 95%'
            },
            {
                id: 's2',
                description: 'Verify order-api logs for "Connection timeout" errors.',
                toolToCall: 'search_logs'
            },
            {
                id: 's3',
                description: 'Restart the order-api pods to reset connections (temporary mitigation).',
                toolToCall: 'restart_pods'
            },
            {
                id: 's4',
                description: 'Scale up the database instance if pool exhaustion persists.'
            }
        ]
    }
};
