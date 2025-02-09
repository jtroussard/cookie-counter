# Use official Node.js runtime as base
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy the rest of the application files
COPY . .

# Expose the port
EXPOSE 5174

# Command to run the application
CMD ["node", "server.js"]
