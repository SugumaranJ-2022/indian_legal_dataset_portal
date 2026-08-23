# Stage 1: Build the React Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /client
COPY legal-dataset-portal/client/package*.json ./
RUN npm install
COPY legal-dataset-portal/client/ ./
# Build production assets (will output to /client/dist)
RUN npm run build

# Stage 2: Serve using FastAPI Backend
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies (needed for compiling certain python packages if any)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY legal-dataset-portal/server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend server code
COPY legal-dataset-portal/server/app ./app

# Copy frontend production build from Stage 1 into /app/client/dist
COPY --from=frontend-builder /client/dist ./client/dist

# Copy sample seed PDFs into /app so the backend seeding finds them
COPY sample_it_act_2000.pdf ./
COPY sample_court_judgment.pdf ./

# Expose port and start FastAPI
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
