# Specifies the base image to be used to build the Docker image
FROM node:lts


# Installs the required packages
RUN apt-get update && \
	npm install -g pnpm

# Sets the working directory
WORKDIR /app

# Installs project dependencies
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN pnpm install
COPY ./ ./


RUN npx prisma generate
RUN pnpm run build

# Exposes port

EXPOSE 3000
EXPOSE 5555

# Starts application
CMD ["pnpm", "start:dev"]
