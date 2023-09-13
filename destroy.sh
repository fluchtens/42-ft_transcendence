#!/bin/sh

# Stop containers
docker stop transcendence-frontend
docker stop transcendence-backend
docker stop transcendence-postgres

# Remove containers
docker rm transcendence-frontend
docker rm transcendence-backend
docker rm transcendence-postgres

# Remove images
docker rmi transcendence-frontend
docker rmi transcendence-backend
# docker rmi postgres

# Remove volumes
docker volume rm $(docker volume ls -q)

# Remove networks
docker network rm transcendence

# Remove prisma migrations
rm -rf backend/prisma/migrations

# docker system prune -a 2>/dev/null

