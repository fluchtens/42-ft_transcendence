# Use node lts alpine as base image
FROM node:lts-alpine

# Update and install required packages
RUN apk update && \
		apk add nginx && \
		npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json .
RUN pnpm install
COPY . .

# Copy env variables
ARG VITE_BACK_URL
ENV VITE_BACK_URL=$VITE_BACK_URL

# Build project app
RUN pnpm run build

# Set up nginx
COPY nginx.conf /etc/nginx/http.d/default.conf

# Exposes port
EXPOSE 80

# Start the application
CMD ["nginx", "-g", "daemon off;"]
