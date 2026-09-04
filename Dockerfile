# Stage 1: Build the React application
FROM node:20-alpine AS build
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy the rest of the application
COPY . .

# Pass in the API Gateway URL as an environment variable during build if needed
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the Vite project (outputs to /app/dist)
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy the static React build files from Stage 1
COPY --from=build /app/dist .

# Copy a custom nginx configuration to handle React Router (SPA) routing
# This ensures that URLs like /login don't return 404 from Nginx
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
