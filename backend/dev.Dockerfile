# Specifies the base image to be used to build the Docker image
FROM node:lts

# Installs the required packages
RUN apt-get update

# Sets the working directory
WORKDIR /app

# Installs project dependencies
COPY package.json package-lock.json ./
RUN npm install
COPY ./ ./

# Setups prisma
RUN npx prisma generate

# Setups class-validator
RUN npm i --save class-validator class-transformer

# Exposes port
EXPOSE 3000
EXPOSE 5555

# Starts application
CMD ["npm", "run", "start:migrate:dev"]
