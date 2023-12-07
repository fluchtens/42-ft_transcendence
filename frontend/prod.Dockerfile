# Specifies the base image to be used to build the Docker image
FROM node:lts-alpine

# Installs the required packages
RUN apk update && \
		apk add nginx

# Sets the working directory
WORKDIR /app

# Installs project dependencies
COPY package.json package-lock.json ./
RUN npm install
COPY ./ ./

# Build project app
# RUN npm run build

# Setups nginx with app
COPY nginx.conf /etc/nginx/http.d/default.conf

# Exposes port
EXPOSE 80

# Starts application
ENTRYPOINT [ "sh", "entrypoint.sh" ]
CMD ["nginx", "-g", "daemon off;"]
