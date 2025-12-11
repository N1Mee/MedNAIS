#!/usr/bin/env python3
"""
FastAPI backend with Stripe integration
Proxies other requests to Next.js on port 3000
"""

from fastapi import FastAPI, Request, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include Stripe routes
from stripe_routes import router as stripe_router
app.include_router(stripe_router)

# Next.js server URL
NEXTJS_URL = "http://localhost:3000"

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def proxy(path: str, request: Request):
    """
    Proxy all requests to Next.js server
    """
    url = f"{NEXTJS_URL}/{path}"
    
    # Get query parameters
    query_string = str(request.url.query)
    if query_string:
        url = f"{url}?{query_string}"
    
    logger.info(f"Proxying {request.method} {url}")
    
    # Prepare headers
    headers = dict(request.headers)
    # Remove host header as httpx will set it automatically
    headers.pop('host', None)
    
    # Get request body
    body = await request.body()
    
    # Set timeout based on endpoint (AI endpoints need longer timeout)
    timeout = 120.0 if 'generate-from-file' in url or 'ai' in url.lower() else 30.0
    
    # Forward request to Next.js
    async with httpx.AsyncClient(follow_redirects=True, timeout=timeout) as client:
        try:
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body
            )
            
            # Return response
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers)
            )
        except Exception as e:
            logger.error(f"Error proxying request: {e}")
            return Response(
                content=f"Proxy error: {str(e)}",
                status_code=502
            )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
