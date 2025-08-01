import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";

const http = httpRouter();

auth.addHttpRoutes(http);

// sendJoinRequestAnnouncement endpoint
http.route({
  path: "/send-join-request-announcement",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const origin = request.headers.get("origin") ?? "";
    const host = request.headers.get("host") ?? "";
    
    // Define allowed origins
    const allowedOrigins = [
      "https://pballersdevelopment.netlify.app",
      ...(origin.startsWith("https://deploy-preview-") && origin.endsWith(".netlify.app") ? [origin] : [])
    ];
    
    const isAllowed = allowedOrigins.includes(origin);
    
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": isAllowed ? origin : "",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin"
        }
      });
    }
    
    // Check if request is from localhost
    const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
    
    // Authentication check (skip if localhost)
    if (!isLocal) {
      try {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": isAllowed ? origin : "",
              "Vary": "Origin"
            }
          });
        }
      } catch (error) {
        console.error("Authentication error:", error);
        return new Response(JSON.stringify({ error: "Authentication failed" }), {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": isAllowed ? origin : "",
            "Vary": "Origin"
          }
        });
      }
    }
    
    // Return success response
    return new Response(JSON.stringify({ status: 200, body: "OK" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": isAllowed ? origin : "",
        "Vary": "Origin"
      }
    });
  })
});

// Handle OPTIONS requests for the endpoint
http.route({
  path: "/send-join-request-announcement",
  method: "OPTIONS",
  handler: httpAction(async (ctx, request) => {
    const origin = request.headers.get("origin") ?? "";
    
    // Define allowed origins
    const allowedOrigins = [
      "https://pballersdevelopment.netlify.app",
      ...(origin.startsWith("https://deploy-preview-") && origin.endsWith(".netlify.app") ? [origin] : [])
    ];
    
    const isAllowed = allowedOrigins.includes(origin);
    
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": isAllowed ? origin : "",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin"
      }
    });
  })
});

export default http;
