# Cookie Counter App

## Screenshots

![login screen](https://file%2B.vscode-resource.vscode-cdn.net/Users/mm_sparrow/Projects/cookie-counter/public/Screenshot%202025-02-09%20at%204.56.33%E2%80%AFPM.png?version%3D1739138225759)  

![main screen](https://file%2B.vscode-resource.vscode-cdn.net/Users/mm_sparrow/Projects/cookie-counter/public/Screenshot%202025-02-09%20at%204.57.22%E2%80%AFPM.png?version%3D1739138246477)

![staged cookies](https://file%2B.vscode-resource.vscode-cdn.net/Users/mm_sparrow/Projects/cookie-counter/public/Screenshot%202025-02-09%20at%204.58.07%E2%80%AFPM.png?version%3D1739138290614)


## Cookie Counter Deployment Guide
This document provides step-by-step instructions on setting up, updating, and deploying both the backend and frontend of the Cookie Counter app on Google Cloud Run.

Prerequisites
Ensure you have:

Google Cloud SDK (gcloud) installed and authenticated.
The Google Cloud project set (cookie-counter-450419).
The required billing and Cloud Run API enabled.
A Google Container Registry (GCR) for storing container images.
A secrets manager configured to securely store credentials.
1️⃣ Setting Up Secrets in Google Cloud
The backend relies on two secrets:

AUTH_PASSWORD → Used for authentication.
GOOGLE_SHEETS_API → URL for Google Sheets API integration.
1.1 Creating and Storing Secrets
Run these commands only once to set up the secrets in Google Secret Manager:

sh
Copy
Edit
# Store AUTH_PASSWORD secret
echo -n "your-password-here" | gcloud secrets create AUTH_PASSWORD --data-file=- --replication-policy=automatic

# Store GOOGLE_SHEETS_API secret
echo -n "https://your-google-sheets-api-url" | gcloud secrets create GOOGLE_SHEETS_API --data-file=- --replication-policy=automatic
1.2 Updating Existing Secrets
If you ever need to update them:

sh
Copy
Edit
# Update AUTH_PASSWORD
echo -n "new-password" | gcloud secrets versions add AUTH_PASSWORD --data-file=-

# Update GOOGLE_SHEETS_API
echo -n "https://new-google-sheets-api-url" | gcloud secrets versions add GOOGLE_SHEETS_API --data-file=-
2️⃣ Backend (Server) Deployment
The backend is located in the server/ directory and deployed as a Node.js app using Google Cloud Run.

2.1 Build & Push the Backend Image
sh
Copy
Edit
cd server

# Build the Docker image
gcloud builds submit --tag gcr.io/cookie-counter-450419/cookie-counter-backend
2.2 Deploy the Backend to Cloud Run
sh
Copy
Edit
gcloud run deploy cookie-counter-backend \
  --image gcr.io/cookie-counter-450419/cookie-counter-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets AUTH_PASSWORD=AUTH_PASSWORD:latest,GOOGLE_SHEETS_API=GOOGLE_SHEETS_API:latest
2.3 Get the Backend URL
sh
Copy
Edit
gcloud run services describe cookie-counter-backend --region us-central1 --format="value(status.url)"
3️⃣ Frontend Deployment
The frontend is built with Vite + React and served using Google Cloud Run.

3.1 Build & Push the Frontend Image
sh
Copy
Edit
# Navigate to project root
cd cookie-counter

# Build the frontend
npm run build

# Submit the build to Google Cloud Build
gcloud builds submit --tag gcr.io/cookie-counter-450419/cookie-counter-frontend
3.2 Deploy the Frontend to Cloud Run
sh
Copy
Edit
gcloud run deploy cookie-counter-frontend \
  --image gcr.io/cookie-counter-450419/cookie-counter-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
3.3 Get the Frontend URL
sh
Copy
Edit
gcloud run services describe cookie-counter-frontend --region us-central1 --format="value(status.url)"
4️⃣ Updating & Redeploying
If you make any code changes to the backend or frontend, you need to:

Rebuild the Docker image
Redeploy the updated version to Cloud Run
4.1 Update the Backend
sh
Copy
Edit
cd server
gcloud builds submit --tag gcr.io/cookie-counter-450419/cookie-counter-backend

gcloud run deploy cookie-counter-backend \
  --image gcr.io/cookie-counter-450419/cookie-counter-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets AUTH_PASSWORD=AUTH_PASSWORD:latest,GOOGLE_SHEETS_API=GOOGLE_SHEETS_API:latest
4.2 Update the Frontend
sh
Copy
Edit
cd cookie-counter
npm run build

gcloud builds submit --tag gcr.io/cookie-counter-450419/cookie-counter-frontend

gcloud run deploy cookie-counter-frontend \
  --image gcr.io/cookie-counter-450419/cookie-counter-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
5️⃣ Viewing Logs & Debugging
To check logs for the backend:

sh
Copy
Edit
gcloud run services logs read cookie-counter-backend --region us-central1 --limit 50
To check logs for the frontend:

sh
Copy
Edit
gcloud run services logs read cookie-counter-frontend --region us-central1 --limit 50
To describe the current Cloud Run deployment:

sh
Copy
Edit
gcloud run services describe cookie-counter-backend --region us-central1
gcloud run services describe cookie-counter-frontend --region us-central1
6️⃣ Cleaning Up (Optional)
If you ever need to delete Cloud Run services:

sh
Copy
Edit
gcloud run services delete cookie-counter-backend --region us-central1
gcloud run services delete cookie-counter-frontend --region us-central1
To remove images from Google Container Registry:

sh
Copy
Edit
gcloud container images delete gcr.io/cookie-counter-450419/cookie-counter-backend
gcloud container images delete gcr.io/cookie-counter-450419/cookie-counter-frontend
To delete all logs:

sh
Copy
Edit
gcloud logging logs delete run.googleapis.com%2Frequests
🎯 Final Notes
The backend and frontend run independently on Cloud Run.
Secrets are managed securely using Google Secret Manager.
Logs can be accessed using gcloud run services logs read.
Updates require rebuilding and redeploying.
🚀 Summary of Key Commands
Action	Command
Build Backend	gcloud builds submit --tag gcr.io/cookie-counter-450419/cookie-counter-backend
Deploy Backend	gcloud run deploy cookie-counter-backend --image gcr.io/cookie-counter-450419/cookie-counter-backend --platform managed --region us-central1 --allow-unauthenticated --set-secrets AUTH_PASSWORD=AUTH_PASSWORD:latest,GOOGLE_SHEETS_API=GOOGLE_SHEETS_API:latest
Build Frontend	npm run build && gcloud builds submit --tag gcr.io/cookie-counter-450419/cookie-counter-frontend
Deploy Frontend	gcloud run deploy cookie-counter-frontend --image gcr.io/cookie-counter-450419/cookie-counter-frontend --platform managed --region us-central1 --allow-unauthenticated
Check Backend Logs	gcloud run services logs read cookie-counter-backend --region us-central1 --limit 50
Check Frontend Logs	gcloud run services logs read cookie-counter-frontend --region us-central1 --limit 50
Get Backend URL	gcloud run services describe cookie-counter-backend --region us-central1 --format="value(status.url)"
Get Frontend URL	gcloud run services describe cookie-counter-frontend --region us-central1 --format="value(status.url)"
This README should make sure you never have to memorize the commands again. 🚀💪