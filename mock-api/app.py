# app.py - FastAPI service providing /api/nodes endpoint
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Constants
API_LATENCY_SECONDS = 1.0

app = FastAPI(title="AI Pipeline Editor API", version="1.0.0")

# Add CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/nodes")
async def get_nodes():
    """Get available node types for the pipeline editor."""
    # Simulate network latency
    await asyncio.sleep(API_LATENCY_SECONDS)
    return [
        {"id": "data-source", "name": "Data Source"},
        {"id": "transformer", "name": "Transformer"},
        {"id": "model", "name": "Model"},
        {"id": "sink", "name": "Sink"}
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
