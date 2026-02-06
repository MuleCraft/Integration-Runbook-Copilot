// Supabase Edge Function: gemini3
// Purpose: Proxy observability API requests to bypass CORS
// URL: https://ijciyvblmbqxqltqdxsd.supabase.co/functions/v1/gemini3

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OBSERVABILITY_API_BASE = "https://observability-api-vgffbg.5sc6y6-1.usa-e2.cloudhub.io";
const ALERTS_API_BASE = "https://alerts-mail-api-vgffbg.5sc6y6-3.usa-e2.cloudhub.io";

interface RequestBody {
  action?: "status" | "deployment" | "smoke";
  service?: string;
  endpoint: string;
  // For alerts endpoint
  count?: number;
  from?: string;
  to?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  try {
    // Parse request body
    const body: RequestBody = await req.json();
    const { action, service, endpoint, count, from, to } = body;

    let targetUrl: string;
    let apiBase: string;

    // Determine which API to call based on endpoint
    if (endpoint === "alerts") {
      // Alerts endpoint
      apiBase = ALERTS_API_BASE;
      const params = new URLSearchParams();
      if (count) params.append("count", count.toString());
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      
      const queryString = params.toString();
      targetUrl = `${apiBase}/api/alerts${queryString ? `?${queryString}` : ""}`;
      
      console.log(`Proxying alerts request with params:`, { count, from, to });
    } else if (endpoint === "observability") {
      // Observability endpoint
      if (!action || !service) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Missing required fields for observability: action and service",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
      
      apiBase = OBSERVABILITY_API_BASE;
      targetUrl = `${apiBase}/observability?action=${action}&service=${service}`;
      
      console.log(`Proxying observability request: ${action} for ${service}`);
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid endpoint: ${endpoint}. Must be 'alerts' or 'observability'`,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
    
    console.log(`Target URL: ${targetUrl}`);

    // Make the request to the observability API
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    // Get response data
    let data;
    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text;
    }

    // Return successful response
    if (response.ok) {
      console.log(`Success: ${action} for ${service}`);
      return new Response(
        JSON.stringify({
          success: true,
          data: data,
          status: response.status,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    } else {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `API returned ${response.status}: ${response.statusText}`,
          data: data,
        }),
        {
          status: 200, // Still return 200 so client can handle the error
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  } catch (error) {
    console.error("Edge function error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 200, // Return 200 so client can handle the error gracefully
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
