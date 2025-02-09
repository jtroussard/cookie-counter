# Use lightweight Node.js image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and install all dependencies (including dev)
COPY package.json package-lock.json ./
RUN npm install  # Do NOT omit dev dependencies since we need vite

# Copy the rest of the project files
COPY . .

# Build the frontend inside the container
RUN npm run build

# Install "serve" to serve static files
RUN npm install -g serve

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Start the frontend
CMD ["serve", "-s", "dist", "-l", "8080"]
