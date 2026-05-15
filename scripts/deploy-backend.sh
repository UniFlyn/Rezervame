#!/bin/bash

# Deployment script for Rezervame Backend to Google Cloud Run
# Usage: ./scripts/deploy-backend.sh [project-id]

PROJECT_ID=${1:-"rezerveme-1fce5"}
REGION="us-central1"
SERVICE_NAME="rezervame-backend"
IMAGE_TAG="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

echo "🚀 Starting deployment for $SERVICE_NAME to $PROJECT_ID..."

# 1. Build the image
echo "📦 Building Docker image..."
docker build -t $IMAGE_TAG ./Backend

# 2. Push to Google Container Registry
echo "📤 Pushing image to GCR..."
docker push $IMAGE_TAG

# 3. Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_TAG \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --allow-unauthenticated \
  --port 4000

echo "✅ Deployment complete!"
echo "🔗 Backend URL: $(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --project $PROJECT_ID --format 'value(status.url)')"
