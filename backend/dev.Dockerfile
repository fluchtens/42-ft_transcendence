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

# Generate prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000
EXPOSE 5555

# Start the application
CMD ["npm", "run", "start:migrate:dev"]
