# Use node lts alpine as base image
FROM node:lts-alpine

# Update and install required packages
RUN apk update

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json .
RUN npm install
COPY . .

# Expose port
EXPOSE 80

# Start the application
CMD ["npm", "run", "dev"]
