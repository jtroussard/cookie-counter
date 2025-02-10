# Stage 1: Build the Vite app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the project files
COPY . .

# Set the build mode dynamically
ARG BUILD_MODE=production
RUN npm run build -- --mode=$BUILD_MODE

# Stage 2: Serve the built app (minimal image)
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only the built files from the previous stage
COPY --from=builder /app/dist /app/dist

# Install "serve" to serve static files
RUN npm install -g serve

# Expose port 8080
EXPOSE 8080

# Start the frontend
CMD ["serve", "-s", "dist", "-l", "8080"]
