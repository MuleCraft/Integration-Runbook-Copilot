/**
 * Supabase Edge Function Client
 * Uses Supabase Edge Functions to bypass CORS issues
 */

import axios from 'axios';

// Supabase Edge Function configuration
const SUPABASE_EDGE_FUNCTION_URL = 'https://ijciyvblmbqxqltqdxsd.supabase.co/functions/v1/gemini3';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create axios instance for Supabase Edge Functions
const supabaseClient = axios.create({
    baseURL: SUPABASE_EDGE_FUNCTION_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        ...(SUPABASE_ANON_KEY && { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }),
    },
});

export interface ObservabilityRequest {
    action: 'status' | 'deployment' | 'smoke';
    service: string;
}

export interface AlertsRequest {
    count?: number;
    from?: string;
    to?: string;
}

export interface ApiResponse {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * Fetch alerts through Supabase Edge Function
 * This bypasses CORS by making the API call server-side
 */
export async function fetchAlertsViaEdgeFunction(
    params?: AlertsRequest
): Promise<ApiResponse> {
    try {
        console.log(`📡 Calling Supabase Edge Function for alerts`, params);
        
        const response = await supabaseClient.post('', {
            endpoint: 'alerts',
            count: params?.count,
            from: params?.from,
            to: params?.to
        });

        if (response.data.success) {
            console.log(`✅ Edge function success: Fetched ${Array.isArray(response.data.data) ? response.data.data.length : 0} alerts`);
            return {
                success: true,
                data: response.data.data
            };
        } else {
            console.warn(`⚠️ Edge function returned error: ${response.data.error}`);
            return {
                success: false,
                error: response.data.error || 'Unknown error'
            };
        }
    } catch (error: any) {
        console.error(`❌ Edge function call failed for alerts:`, error.message);
        return {
            success: false,
            error: error.message || 'Failed to call edge function'
        };
    }
}

/**
 * Fetch observability data through Supabase Edge Function
 * This bypasses CORS by making the API call server-side
 */
export async function fetchObservabilityViaEdgeFunction(
    action: 'status' | 'deployment' | 'smoke',
    service: string
): Promise<ApiResponse> {
    try {
        console.log(`📡 Calling Supabase Edge Function: ${action} for ${service}`);
        
        const response = await supabaseClient.post('', {
            action,
            service,
            endpoint: 'observability'
        });

        if (response.data.success) {
            console.log(`✅ Edge function success: ${action} for ${service}`);
            return {
                success: true,
                data: response.data.data
            };
        } else {
            console.warn(`⚠️ Edge function returned error: ${response.data.error}`);
            return {
                success: false,
                error: response.data.error || 'Unknown error'
            };
        }
    } catch (error: any) {
        console.error(`❌ Edge function call failed: ${action} for ${service}`, error.message);
        return {
            success: false,
            error: error.message || 'Failed to call edge function'
        };
    }
}

/**
 * Fetch all observability data for a service
 */
export async function fetchAllObservabilityData(service: string) {
    const actions: Array<'status' | 'deployment' | 'smoke'> = ['status', 'deployment', 'smoke'];
    
    const results = await Promise.all(
        actions.map(async (action) => {
            const result = await fetchObservabilityViaEdgeFunction(action, service);
            return { action, ...result };
        })
    );

    return {
        status: results.find(r => r.action === 'status')?.data || null,
        deployment: results.find(r => r.action === 'deployment')?.data || null,
        smoke: results.find(r => r.action === 'smoke')?.data || null,
        allSuccessful: results.every(r => r.success),
        errors: results.filter(r => !r.success).map(r => ({ action: r.action, error: r.error }))
    };
}

export default supabaseClient;
