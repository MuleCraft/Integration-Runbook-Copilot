import axios from 'axios';
import type { IncidentAnalysisResponse, Incident } from '../types';
import { MOCK_RESPONSE } from './mockData';
import { analyzeEmailAlertsWithMistral, analyzeObservabilityWithMistral } from './mistral';
import { fetchAllObservabilityData, fetchAlertsViaEdgeFunction } from './supabase-client';

// API base URLs - use environment variables if available, otherwise use proxy
const MULE_API_BASE = import.meta.env.VITE_MULE_API_BASE_URL || '';
const OBSERVABILITY_API_BASE = import.meta.env.VITE_OBSERVABILITY_API_BASE_URL || '';

// Feature flags
const ENABLE_OBSERVABILITY = import.meta.env.VITE_ENABLE_OBSERVABILITY !== 'false';
const USE_EDGE_FUNCTION = import.meta.env.VITE_USE_EDGE_FUNCTION !== 'false'; // Default to true

// Create axios instance with CORS-friendly configuration
const apiClient = axios.create({
    timeout: 10000, // 10 second timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper function to check if error is CORS-related
function isCorsError(error: any): boolean {
    return (
        error.message === 'Network Error' ||
        error.code === 'ERR_NETWORK' ||
        (error.response === undefined && error.request !== undefined)
    );
}

async function fetchObservabilityData(service: string, alertTitle: string, alertSummary?: string) {
    // Check if observability is enabled
    if (!ENABLE_OBSERVABILITY) {
        console.log(`🔕 Observability disabled for ${service} (VITE_ENABLE_OBSERVABILITY=false)`);
        
        // Even with observability disabled, provide AI analysis based on alert details
        const aiSummary = await analyzeObservabilityWithMistral(
            { status: 'Disabled', lastCheckTime: 'N/A' },
            { version: 'N/A', deployedAt: 'N/A', deployedBy: 'N/A', changeSummary: 'N/A' },
            { success: false, error: 'No data' },
            alertTitle,
            alertSummary
        );
        
        return {
            data: {
                status: 'Disabled',
                lastCheckTime: new Date().toISOString(),
                version: 'N/A',
                deployedAt: 'N/A',
                deployedBy: 'N/A',
                changeSummary: 'N/A',
                smoke: 'N/A',
            },
            aiSummary: aiSummary,
            corsIssue: false
        };
    }

    // Use Supabase Edge Function if enabled (bypasses CORS)
    if (USE_EDGE_FUNCTION) {
        console.log(`🚀 Using Supabase Edge Function for ${service} (no CORS issues)`);
        try {
            const result = await fetchAllObservabilityData(service);
            
            let statusData = result.status || { status: 'Unknown', lastCheckTime: 'N/A' };
            let deployData = result.deployment || { version: 'N/A', deployedAt: 'N/A', deployedBy: 'N/A', changeSummary: 'N/A' };
            let smokeData = result.smoke || { success: false, error: 'No data' };

            // Check if all requests failed
            if (!result.allSuccessful && result.errors.length === 3) {
                console.warn(`🚫 All edge function calls failed for ${service}`);
                return {
                    data: {
                        status: 'Unavailable',
                        lastCheckTime: new Date().toISOString(),
                        version: 'N/A',
                        deployedAt: 'N/A',
                        deployedBy: 'N/A',
                        changeSummary: 'N/A',
                        smoke: 'N/A',
                    },
                    aiSummary: null,
                    corsIssue: false
                };
            }

            // Get AI analysis with alert summary
            const aiSummary = await analyzeObservabilityWithMistral(statusData, deployData, smokeData, alertTitle, alertSummary);

            return {
                data: {
                    status: statusData.status || 'Unknown',
                    lastCheckTime: statusData.lastCheckTime || new Date().toISOString(),
                    version: deployData.version || 'N/A',
                    deployedAt: deployData.deployedAt || 'N/A',
                    deployedBy: deployData.deployedBy || 'N/A',
                    changeSummary: deployData.changeSummary || 'N/A',
                    smoke: smokeData ? (smokeData.success ? 'Passed' : 'Failed') : 'N/A',
                },
                aiSummary: aiSummary,
                corsIssue: false
            };
        } catch (error: any) {
            console.error(`❌ Edge function error for ${service}:`, error.message);
            return {
                data: {
                    status: 'Error',
                    lastCheckTime: new Date().toISOString(),
                    version: 'N/A',
                    deployedAt: 'N/A',
                    deployedBy: 'N/A',
                    changeSummary: 'N/A',
                    smoke: 'N/A',
                },
                aiSummary: null,
                corsIssue: false
            };
        }
    }

    // Fallback to direct API calls (original method)
    const baseUrl = OBSERVABILITY_API_BASE 
        ? `${OBSERVABILITY_API_BASE}/observability`
        : '/api-observability/observability';
    
    console.log(`🔍 Fetching observability for ${service} from ${baseUrl.includes('localhost') ? 'proxy' : 'direct API'}`);
    const actions = ['status', 'deployment', 'smoke'];

    let statusData = { status: 'Unknown', lastCheckTime: 'N/A' };
    let deployData = { version: 'N/A', deployedAt: 'N/A', deployedBy: 'N/A', changeSummary: 'N/A' };
    let smokeData = { success: false, error: 'No data' };
    let corsIssueDetected = false;
    let consecutiveFailures = 0;

    try {
        const rawResults = await Promise.all(
            actions.map(async (action) => {
                try {
                    const response = await apiClient.get(`${baseUrl}?action=${action}&service=${service}`, {
                        // Additional CORS-friendly options
                        withCredentials: false,
                        timeout: 5000, // Reduced timeout to fail faster
                    });
                    return { action, data: response.data, success: true };
                } catch (e: any) {
                    consecutiveFailures++;
                    
                    // Check if this is a CORS error
                    if (isCorsError(e)) {
                        corsIssueDetected = true;
                        console.warn(`⚠️ CORS blocked: ${action} for ${service}`);
                    } else if (e.code === 'ECONNABORTED') {
                        console.warn(`⏱️ Timeout: ${action} for ${service}`);
                    } else {
                        console.warn(`❌ Error: ${action} for ${service}:`, e.message);
                    }
                    return { action, data: null, success: false };
                }
            })
        );

        // Check if all requests failed
        const allFailed = rawResults.every(r => !r.success);
        if (allFailed) {
            console.warn(`🚫 All observability endpoints failed for ${service}. Skipping AI analysis.`);
            return {
                data: {
                    status: corsIssueDetected ? 'CORS Blocked' : 'Unavailable',
                    lastCheckTime: new Date().toISOString(),
                    version: 'N/A',
                    deployedAt: 'N/A',
                    deployedBy: 'N/A',
                    changeSummary: 'N/A',
                    smoke: 'N/A',
                },
                aiSummary: null,
                corsIssue: corsIssueDetected
            };
        }

        const fetchedStatus = rawResults.find(r => r.action === 'status')?.data;
        const fetchedDeploy = rawResults.find(r => r.action === 'deployment')?.data;
        const fetchedSmoke = rawResults.find(r => r.action === 'smoke')?.data;

        if (fetchedStatus) statusData = fetchedStatus;
        if (fetchedDeploy) deployData = fetchedDeploy;
        if (fetchedSmoke) smokeData = fetchedSmoke;

    } catch (error: any) {
        if (isCorsError(error)) {
            console.warn(`CORS issue: Cannot access observability API for ${service}. The API server needs to enable CORS.`);
            corsIssueDetected = true;
        } else {
            console.warn(`Could not fetch observability data for ${service}:`, error.message);
        }
    }

    // If CORS issue detected, provide a friendly message in the status
    if (corsIssueDetected) {
        statusData = { 
            status: 'CORS Restricted', 
            lastCheckTime: new Date().toISOString() 
        };
    }

    // Always get AI analysis, even if API failed (AI will explain the "Offline" state)
    // Pass alertSummary so AI can provide insights even with missing observability data
    const aiSummary = await analyzeObservabilityWithMistral(statusData, deployData, smokeData, alertTitle, alertSummary);

    return {
        data: {
            status: statusData.status || 'Offline',
            lastCheckTime: statusData.lastCheckTime || new Date().toISOString(),
            version: deployData.version || 'N/A',
            deployedAt: deployData.deployedAt || 'N/A',
            deployedBy: deployData.deployedBy || 'N/A',
            changeSummary: deployData.changeSummary || 'N/A',
            smoke: smokeData ? (smokeData.success ? 'Passed' : 'Failed') : 'N/A',
        },
        aiSummary: aiSummary,
        corsIssue: corsIssueDetected
    };
}

export interface AnalysisParams {
    count?: number;
    from?: string;
    to?: string;
}

export async function analyzeAlerts(useSample: boolean, params?: AnalysisParams): Promise<IncidentAnalysisResponse> {
    if (useSample) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(MOCK_RESPONSE);
            }, 1500);
        });
    }

    try {
        let rawEmails;

        // Use Supabase Edge Function if enabled (bypasses CORS)
        if (USE_EDGE_FUNCTION) {
            console.log(`🚀 Using Supabase Edge Function for alerts (no CORS issues)`);
            const result = await fetchAlertsViaEdgeFunction(params);
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch alerts via edge function');
            }
            
            rawEmails = result.data;
        } else {
            // Fallback to direct API call
            const queryParams = new URLSearchParams();
            if (params?.count) queryParams.append('count', params.count.toString());
            if (params?.from) queryParams.append('from', params.from);
            if (params?.to) queryParams.append('to', params.to);

            const queryString = queryParams.toString();
            const url = MULE_API_BASE 
                ? `${MULE_API_BASE}/api/alerts${queryString ? `?${queryString}` : ''}`
                : `/api-mule/api/alerts${queryString ? `?${queryString}` : ''}`;

            console.log(`🔍 Fetching alerts from ${url.includes('localhost') ? 'proxy' : 'direct API'}`);

            const response = await apiClient.get(url, {
                withCredentials: false, // Disable credentials for CORS
            });
            rawEmails = response.data;
        }

        // Handle different response formats between local and production
        // Production might wrap the array in an object
        if (!Array.isArray(rawEmails)) {
            // Try common wrapper patterns
            if (rawEmails && Array.isArray(rawEmails.data)) {
                rawEmails = rawEmails.data;
            } else if (rawEmails && Array.isArray(rawEmails.alerts)) {
                rawEmails = rawEmails.alerts;
            } else if (rawEmails && Array.isArray(rawEmails.emails)) {
                rawEmails = rawEmails.emails;
            } else if (rawEmails && Array.isArray(rawEmails.items)) {
                rawEmails = rawEmails.items;
            } else {
                console.error('Unexpected API response format:', rawEmails);
                throw new Error(`Invalid response format from MuleSoft API. Expected array but got: ${typeof rawEmails}. Check console for details.`);
            }
        }

        if (rawEmails.length === 0) {
            console.warn('MuleSoft API returned empty array');
        }

        // Strip HTML content before sending to Mistral to reduce token usage
        // We'll use the local HTML content directly later
        // Use bodyPreview (text) instead of HTML content for accurate analysis
        const emailsWithoutHtml = rawEmails.map((email: any, index: any) => ({
            emailIndex: index, // Add index to help match alerts back to original emails
            subject: email.subject,
            sender: email.displayName || email.from,
            timestamp: email.lastupdatedTime || email.date,
            apiName: email.apiName,
            environment: email.environment,
            object: email.object,
            priority: email.priority,
            importance: email.importance,
            // Use bodyPreview which contains extracted text with error details
            bodyPreview: email.bodyPreview || ''
        }));

        // Call Mistral SDK module with stripped data
        const analyzedAlerts = await analyzeEmailAlertsWithMistral(JSON.stringify(emailsWithoutHtml));

        const mappedIncidents: Incident[] = await Promise.all(analyzedAlerts.map(async (alert) => {
            let sev: any = 'P3';
            if (alert.severity === 'Critical') sev = 'P1';
            else if (alert.severity === 'High') sev = 'P2';

            const appName = alert.appName || 'Unknown API';

            // Fetch observability info and AI summary in parallel for this app
            // Pass alert summary so AI can analyze even when observability data is unavailable
            const obsResult = await fetchObservabilityData(appName, alert.title, alert.summary);

            // Use emailIndex for exact matching to original email
            const originalEmail = typeof alert.emailIndex === 'number' 
                ? rawEmails[alert.emailIndex]
                : rawEmails.find((e: any) =>
                    (alert.originalSubject && e.subject === alert.originalSubject) ||
                    e.subject.toLowerCase().includes(alert.title.toLowerCase()) ||
                    alert.title.toLowerCase().includes(e.subject.toLowerCase())
                );

            return {
                id: alert.id || `ai-${alert.emailIndex ?? Date.now()}`,
                service: alert.title,
                severity: sev,
                summary: alert.summary,
                timestamp: alert.timestamp || new Date().toISOString(),
                source: alert.sender || 'MuleSoft System',
                status: 'Investigating',
                // Use HTML directly from local rawEmails array (not from Mistral response)
                rawContent: originalEmail?.content || alert.summary,
                appName: appName,
                environment: alert.environment || 'Unspecified',
                object: alert.object || 'Unspecified',
                importance: (alert.severity === 'Critical' || alert.severity === 'High') ? 'high' : 'normal',
                errorMessage: alert.summary,
                observabilityData: obsResult.data,
                aiHealthSummary: obsResult.aiSummary || undefined
            };
        }));

        if (mappedIncidents.length === 0) {
            return {
                incidents: [],
                topIncidentService: 'None',
                runbook: {
                    incidentSummary: 'No critical alerts identified in the analyzed period.',
                    hypotheses: [],
                    steps: []
                }
            };
        }

        const topIncident = mappedIncidents[0];

        return {
            incidents: mappedIncidents,
            topIncidentService: topIncident.service,
            runbook: {
                incidentSummary: `System analyzed ${rawEmails.length} emails and identified ${mappedIncidents.length} actionable incidents.`,
                hypotheses: [
                    {
                        id: 'h1',
                        title: 'AI Root Cause Analysis',
                        explanation: topIncident.summary,
                        confidence: 90
                    }
                ],
                steps: analyzedAlerts.slice(0, 3).map((alert, idx) => ({
                    id: `step-${idx}`,
                    description: alert.suggestedAction || 'Review system logs for specific error details.',
                    toolToCall: 'check_sf_connector'
                }))
            }
        };
    } catch (error: any) {
        console.error('Analyze error:', error);
        
        // Check for CORS error
        if (isCorsError(error)) {
            const corsError = new Error(
                'CORS Error: The API server is blocking requests from this origin. ' +
                'This usually happens when:\n' +
                '1. The API needs to enable CORS headers\n' +
                '2. You\'re using the production URL without proper CORS configuration\n' +
                '3. The API endpoint is incorrect\n\n' +
                'Try running locally with "npm run dev" to use the proxy, or contact the API administrator to enable CORS.'
            );
            throw corsError;
        }
        
        // Enhanced error logging for debugging
        if (error.response) {
            // The request was made and the server responded with a status code outside of 2xx
            console.error('API Response Error:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
                headers: error.response.headers
            });
            
            // Provide user-friendly error message
            if (error.response.status === 404) {
                throw new Error('API endpoint not found. Please check the configuration.');
            } else if (error.response.status === 401 || error.response.status === 403) {
                throw new Error('Authentication failed. Please check your API credentials.');
            } else if (error.response.status >= 500) {
                throw new Error('Server error. The API is experiencing issues. Please try again later.');
            }
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received from API:', error.request);
            throw new Error('No response from server. Please check your internet connection and try again.');
        }
        
        throw error;
    }
}

