import { Mistral } from '@mistralai/mistralai';

const API_KEY = import.meta.env.VITE_MISTRAL_API_KEY || "";

export type AlertAnalysis = {
    emailIndex?: number;   // Index to match back to original email
    id: string;
    title: string;
    originalSubject?: string;
    summary: string;
    severity: "Low" | "Medium" | "High" | "Critical";
    suggestedAction: string;
    sender: string;
    timestamp: string;
    appName: string;       // Extract from apiName field
    environment?: string;
    object?: string;
};

export async function analyzeEmailAlertsWithMistral(emailJson: string, overrideApiKey?: string): Promise<AlertAnalysis[]> {
    const activeKey = overrideApiKey || API_KEY;
    if (!activeKey) {
        throw new Error("Mistral API Key not found. Please provide one in the UI or .env file.");
    }

    const client = new Mistral({ apiKey: activeKey });

    const prompt = `
    You are an expert security and system administrator. 
    Analyze the following JSON data which contains email alert metadata.
    Each email has a unique emailIndex - you MUST return exactly ONE alert for EACH input email, preserving the emailIndex.
    
    CRITICAL INSTRUCTIONS:
    1. Process EVERY email: Return exactly ONE alert object for EACH email in the input array. If input has 7 emails, output MUST have 7 alerts.
    2. Preserve emailIndex: Each output alert MUST include the "emailIndex" field from its corresponding input email.
    3. Extract Unique Details: Carefully read the "bodyPreview" field to extract the SPECIFIC error for EACH alert:
       - Error types (e.g., INTERNAL_SERVER_ERROR, FORBIDDEN, UNAUTHORIZED, TOO_MANY_REQUESTS, BAD_SQL_SYNTAX)
       - HTTP status codes (e.g., 500, 403, 401, 429)
       - Specific error messages
       - Correlation IDs
    4. Date Formatting: Return "timestamp" in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ).
    5. Severity Mapping: 
       - If "CRITICAL" in subject or HTTP 5xx errors: "Critical"
       - If 4xx errors or "High": "High"
       - If "Medium" or minor issues: "Medium"
       - Otherwise: "Low"
    
    Each output object must have:
    - emailIndex: The exact emailIndex from the input (REQUIRED for matching).
    - id: A unique string identifier (e.g., "alert-{emailIndex}").
    - title: A concise, SPECIFIC title reflecting the UNIQUE error (e.g., "Order API Internal Server Error (500)", "Order API Forbidden Error (403)", "Payment API SQL Syntax Error").
    - summary: A detailed technical summary extracted from bodyPreview, including the SPECIFIC error type and message for THIS alert.
    - originalSubject: The exact "subject" field from input.
    - severity: "Low", "Medium", "High", or "Critical".
    - suggestedAction: Root cause fix specific to THIS error type.
    - sender: The "sender" field from input.
    - timestamp: The "timestamp" field from input in ISO 8601 format.
    - appName: The "apiName" field (e.g., "order-api", "payment-api").
    - environment: Extract from bodyPreview or use "prod" as default.
    - object: Extract from bodyPreview (e.g., "order", "payment", "invoice").
    
    VALIDATION:
    - Output array length MUST equal input array length.
    - Each alert MUST have unique, specific details from its bodyPreview.
    - DO NOT merge or deduplicate alerts with similar errors - treat each as separate.
    
    Return ONLY valid JSON.
    
    Input JSON:
    ${emailJson}
  `;

    try {
        const chatResponse = await client.chat.complete({
            model: 'mistral-large-latest',
            messages: [{ role: 'user', content: prompt }],
            responseFormat: { type: 'json_object' }
        });

        const content = chatResponse.choices?.[0]?.message?.content;
        if (typeof content !== 'string') {
            throw new Error("Invalid response from Mistral AI");
        }

        // Mistral with json_object usually returns the array directly or wrapped in an object
        const parsed = JSON.parse(content);
        // If the model wrapped it in a key like "alerts"
        const alerts = Array.isArray(parsed) ? parsed : (parsed.alerts || Object.values(parsed)[0]);

        return alerts as AlertAnalysis[];
    } catch (error) {
        console.error("Error analyzing alerts with Mistral:", error);
        throw error;
    }
}

export async function analyzeObservabilityWithMistral(rawStatus: any, rawDeploy: any, rawSmoke: any, alertTitle: string, alertSummary?: string): Promise<any> {
    const activeKey = API_KEY;
    if (!activeKey) return null;

    const client = new Mistral({ apiKey: activeKey });

    // Check if observability data is mostly N/A
    const hasObservabilityData = rawStatus?.status !== 'N/A' && rawStatus?.status !== 'Unknown';
    
    const prompt = `
    You are an expert site reliability engineer analyzing: "${alertTitle}"
    
    ${alertSummary ? `Alert Summary: ${alertSummary}` : ''}
    
    Observability Data:
    - Status: ${JSON.stringify(rawStatus)}
    - Deployment: ${JSON.stringify(rawDeploy)}
    - Smoke Tests: ${JSON.stringify(rawSmoke)}
    
    IMPORTANT INSTRUCTIONS:
    ${!hasObservabilityData ? `
    The observability data is unavailable (N/A/Unknown). You MUST analyze based on the alert title and summary instead.
    Extract insights from the error message, API name, and alert severity.
    ` : ''}
    
    Provide a professional analysis with SHORT KEY POINTS (max 15 words each):
    
    1. statusSection: 
       ${!hasObservabilityData ? 
       `- Analyze the alert title/summary to infer service health
       - Mention specific error types (e.g., "SQL syntax error", "HTTP 500", "Authentication failed")
       - State impact (e.g., "• Payment processing unavailable", "• Database query failures")` :
       `- 2-3 bullet points on current health status
       - Start with API name (e.g., "Payment API: Experiencing errors")
       - If 'Unknown', infer connection/availability issue`}
    
    2. deploymentSection:
       ${!hasObservabilityData ?
       `- Say "• Deployment history unavailable - monitoring infrastructure may be down"
       - Or "• Recent code changes may have introduced errors"` :
       `- Latest deployment info or "• No recent deployments detected"
       - Include version, time, deployer if available`}
    
    3. smokeSection:
       ${!hasObservabilityData ?
       `- Infer from alert: "• Based on alert - service failing basic operations"
       - Mention specific failure type (DB error, API error, etc.)` :
       `- Smoke test results
       - If failed, extract ERROR message
       - If N/A, say "• Automated validation not configured"`}
    
    4. conclusion:
       - Brief summary of situation and urgency
       - Example: "Payment API experiencing database errors - immediate investigation required"
       - Example: "Service health unknown - monitoring gaps detected"
    
    5. recommendedSeverity: 
       - "P1" if service completely down or critical errors
       - "P2" if significant errors but service partially working
       - "P3" if minor issues or monitoring unavailable
       - "P4" if informational only
    
    CRITICAL RULES:
    - NEVER output just "N/A" or "Unknown" - always provide context
    - Extract specific error details from alert title/summary
    - Be actionable - what should engineers investigate?
    - If monitoring data unavailable, acknowledge it professionally
    
    Return as valid JSON with these 5 keys (strings except recommendedSeverity).
    Return ONLY the JSON, no other text.
    `;

    try {
        const response = await client.chat.complete({
            model: 'mistral-large-latest',
            messages: [{ role: 'user', content: prompt }],
            responseFormat: { type: 'json_object' }
        });

        const content = response.choices?.[0]?.message?.content;
        if (typeof content !== 'string') return null;
        
        const parsed = JSON.parse(content);
        
        // Validate and ensure all fields are strings
        if (parsed && typeof parsed === 'object') {
            return {
                statusSection: String(parsed.statusSection || ''),
                deploymentSection: String(parsed.deploymentSection || ''),
                smokeSection: String(parsed.smokeSection || ''),
                conclusion: String(parsed.conclusion || ''),
                recommendedSeverity: parsed.recommendedSeverity || undefined
            };
        }
        
        return null;
    } catch (error) {
        console.error("AI Health Analysis Error:", error);
        return null;
    }
}
