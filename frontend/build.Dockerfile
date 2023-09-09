# Specifies the base image to be used to build the Docker image
FROM node:lts-alpine

# Installs the required packages
RUN apk update && \
	apk add nginx && \
	npm install -g pnpm

# Sets the working directory
WORKDIR /app

# Installs project dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY ./ ./

# Build project app
RUN pnpm run build

# Setups nginx with app
COPY nginx.conf /etc/nginx/http.d/default.conf

# Exposes port
EXPOSE 80

# Starts application
CMD ["nginx", "-g", "daemon off;"]
