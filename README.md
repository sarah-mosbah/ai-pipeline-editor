# AI Pipeline Editor

A visual pipeline editor for building AI workflows with drag-and-drop functionality. Built with React, TypeScript, ReactFlow, and FastAPI.

## Features

- **Visual Pipeline Builder**: Drag and drop nodes to create AI pipelines
- **Connection Validation**: Prevents invalid connections and cycles
- **Execution**: Execute pipelines with visual feedback

## Architecture

### Frontend (React + TypeScript)
- **ReactFlow**: Visual graph editor
- **MobX**: State management
- **Vite**: Build tool and dev server

## Installation

```bash
# Clone the repository
git clone git@github.com:sarah-mosbah/ai-pipeline-editor.git

cd ai-pipeline-editor

# Start the application
docker compose up --build
```

**Access Points:**
- Frontend: http://localhost:5173
- API: http://localhost:8000/api/nodes

## Development Setup

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```
You need to change nginx to the correct server url

### Backend Development
```bash
cd mock-api
pip install fastapi uvicorn[standard]
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

## Testing

```bash
cd frontend
npm run test
```

## Tech Stack

- **Frontend**: React, TypeScript, ReactFlow, MobX, Vite
- **Backend**: FastAPI, Python
- **DevOps**: Docker, Docker Compose, Nginx