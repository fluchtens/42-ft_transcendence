# Use node lts alpine as base image
FROM node:22-alpine3.19

# Update and install required packages
RUN apk update && \
    npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json .
RUN pnpm install
COPY . .

# Expose port
EXPOSE 80

# Start the application
CMD ["pnpm", "run", "dev"]
