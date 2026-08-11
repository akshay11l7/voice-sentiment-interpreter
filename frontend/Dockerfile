# Stage 1: Build the React application
FROM node:22-alpine AS build

# Set working directory
WORKDIR /app

# Install dependencies
# Copy package.json first to leverage Docker cache
COPY package.json ./
# If package-lock.json exists, it's better to copy it too: COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React app for production
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Copy the custom Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app from the previous stage to Nginx's web root
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
