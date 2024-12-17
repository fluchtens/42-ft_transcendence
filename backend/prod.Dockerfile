# Use node lts alpine as base image
FROM node:22-alpine3.19

# Update and install required packages
RUN apk update

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json .
RUN npm install
COPY . .

# Generate prisma client
RUN npx prisma generate

# Build project app
RUN npm run build

# Exposes port
EXPOSE 3000
EXPOSE 5555

# Start the application
CMD ["npm", "run", "start:migrate:prod"]
