# Cookie Counter App

## TODO

1. backend sync issue
1. password retry attempts
1. token investigation

## Screenshots

![login screen](https://file%2B.vscode-resource.vscode-cdn.net/Users/mm_sparrow/Projects/cookie-counter/public/Screenshot%202025-02-09%20at%204.56.33%E2%80%AFPM.png?version%3D1739138225759)  

![main screen](https://file%2B.vscode-resource.vscode-cdn.net/Users/mm_sparrow/Projects/cookie-counter/public/Screenshot%202025-02-09%20at%204.57.22%E2%80%AFPM.png?version%3D1739138246477)

![staged cookies](https://file%2B.vscode-resource.vscode-cdn.net/Users/mm_sparrow/Projects/cookie-counter/public/Screenshot%202025-02-09%20at%204.58.07%E2%80%AFPM.png?version%3D1739138290614)


## Cookie Counter Deployment Guide
This document provides step-by-step instructions on setting up, updating, and deploying both the backend and frontend of the Cookie Counter app on Google Cloud Run.

## Prerequisites
Ensure you have:

- Google Cloud SDK (gcloud) installed and authenticated.
- The Google Cloud project set (cookie-counter-450419).
- The required billing and Cloud Run API enabled.
- A Google Container Registry (GCR) for storing container images.
- A secrets manager configured to securely store credentials.

## Setting Up Secrets in Google Cloud
The backend relies on two secrets:

- AUTH_PASSWORD → Used for authentication.
- GOOGLE_SHEETS_API → URL for Google Sheets API integration.

### Creating and Storing Secrets
Run these commands only once to set up the secrets in Google Secret Manager:

```sh
echo -n "your-password-here" | gcloud secrets create AUTH_PASSWORD --data-file=- --replication-policy=automatic
```
```sh
echo -n "https://your-google-sheets-api-url" | gcloud secrets create GOOGLE_SHEETS_API --data-file=- --replication-policy=automatic
```

### Updating Existing Secrets
If you ever need to update them:

```sh
echo -n "new-password" | gcloud secrets versions add AUTH_PASSWORD --data-file=-
```

### Update GOOGLE_SHEETS_API

```sh
echo -n "https://new-google-sheets-api-url" | gcloud secrets versions add GOOGLE_SHEETS_API --data-file=-
```

## Backend (Server) Deployment (PROD)
The backend is located in the backend/ directory and deployed as a Node.js app using Google Cloud Run.

### Build & Push the Backend Image

```sh
cd backend
```

### Cloud Commands
```sh
gcloud builds submit --tag gcr.io/cookie-counter-450419/cookie-counter-backend

gcloud run deploy cookie-counter-backend \
  --image gcr.io/cookie-counter-450419/cookie-counter-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets AUTH_PASSWORD=AUTH_PASSWORD:latest,GOOGLE_SHEETS_API=GOOGLE_SHEETS_API:latest

gcloud run services describe cookie-counter-backend --region us-central1 --format="value(status.url)"
```

## Backend (Server) Deployment (DEV)
The backend is located in the backend/ directory and deployed as a Node.js app using Google Cloud Run.

### Build & Push the Backend Image

```sh
cd backend
```

### Cloud Commands
```sh
gcloud builds submit --tag gcr.io/cookie-counter-450419/cookie-counter-backend-dev

gcloud run deploy cookie-counter-backend-dev \
  --image gcr.io/cookie-counter-450419/cookie-counter-backend-dev \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets AUTH_PASSWORD=AUTH_PASSWORD_DEV:latest,GOOGLE_SHEETS_API=GOOGLE_SHEETS_API_DEV:latest

gcloud run services describe cookie-counter-backend-dev --region us-central1 --format="value(status.url)"
```

## Frontend Deployment (PROD)
The frontend is built with Vite + React and served using Google Cloud Run.

```sh
cd frontend
```

### Cloud Commands
```sh
gcloud builds submit --config cloudbuild-production.yml

gcloud run deploy cookie-counter-frontend \
  --image gcr.io/cookie-counter-450419/cookie-counter-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

gcloud run services describe cookie-counter-frontend --region us-central1 --format="value(status.url)"
```

## Frontend Deployment (DEV)
The frontend is built with Vite + React and served using Google Cloud Run.

### Build & Push the Frontend Image

```sh
cd frontend
```

### Submit the build to Google Cloud Build
```sh
gcloud builds submit --config cloudbuild-development.yml

gcloud run deploy cookie-counter-frontend-dev \
  --image gcr.io/cookie-counter-450419/cookie-counter-frontend-dev \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

gcloud run services describe cookie-counter-frontend-dev --region us-central1 --format="value(status.url)"
```

## Frontend Deployment (LOCAL)

### Using Docker
```sh
cd frontend

docker build --build-arg BUILD_MODE=localhost -t cookie-counter-frontend:localhost .

docker run -p 8080:8080 cookie-counter-frontend:localhost
```

### Using NPM
```sh
cd frontend

npm install

npm run dev:local
```

## Updating & Redeploying
If you make any code changes to the backend or frontend, you need to:

- Rebuild the Docker image
- Redeploy the updated version to Cloud Run

## Viewing Logs & Debugging
To check logs for the backend:

```sh
gcloud run services logs read cookie-counter-backend --region us-central1 --limit 50
```

To check logs for the frontend:

```sh
gcloud run services logs read cookie-counter-frontend --region us-central1 --limit 50
```

To describe the current Cloud Run deployment:

```sh
gcloud run services describe cookie-counter-backend --region us-central1
gcloud run services describe cookie-counter-frontend --region us-central1
```

## Cleaning Up (Optional)
If you ever need to delete Cloud Run services:

```sh
gcloud run services delete cookie-counter-backend --region us-central1
gcloud run services delete cookie-counter-frontend --region us-central1
```

To remove images from Google Container Registry:

```sh
gcloud container images delete gcr.io/cookie-counter-450419/cookie-counter-backend
gcloud container images delete gcr.io/cookie-counter-450419/cookie-counter-frontend
```

To delete all logs:

```sh
gcloud logging logs delete run.googleapis.com%2Frequests
```

## Final Notes
- The backend and frontend run independently on Cloud Run.
- Secrets are managed securely using Google Secret Manager.
- Logs can be accessed using gcloud run services logs read.
- Updates require rebuilding and redeploying.

## Summary of Key Commands
| Action              | Command |
|---------------------|---------|
| **Build Backend**   | `gcloud builds submit --tag gcr.io/cookie-counter-450419/cookie-counter-backend` |
| **Deploy Backend**  | `gcloud run deploy cookie-counter-backend --image gcr.io/cookie-counter-450419/cookie-counter-backend --platform managed --region us-central1 --allow-unauthenticated --set-secrets AUTH_PASSWORD=AUTH_PASSWORD:latest,GOOGLE_SHEETS_API=GOOGLE_SHEETS_API:latest` |
| **Build Frontend**  | `gcloud builds submit --config {cloudbuild-yml-file}` |
| **Deploy Frontend** | `gcloud run deploy cookie-counter-frontend --image gcr.io/cookie-counter-450419/cookie-counter-frontend --platform managed --region us-central1 --allow-unauthenticated` |
| **Check Backend Logs** | `gcloud run services logs read cookie-counter-backend --region us-central1 --limit 50` |
| **Check Frontend Logs** | `gcloud run services logs read cookie-counter-frontend --region us-central1 --limit 50` |
| **Get Backend URL** | `gcloud run services describe cookie-counter-backend --region us-central1 --format="value(status.url)"` |
| **Get Frontend URL** | `gcloud run services describe cookie-counter-frontend --region us-central1 --format="value(status.url)"` |


## Known issues
1. If the "database" is out of sync with the front end the invetory never recovers. To duplicate, open two windows, create a transaction with one, then another transaction with another, then move back to the original and create another tranasaction. The resulting invetory on the first instance will be out of sync with the database.