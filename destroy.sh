#!/bin/sh
docker stop $(docker ps -aq) 2>/dev/null
docker rm $(docker ps -aq) 2>/dev/null
docker rmi $(docker images -aq) 2>/dev/null
docker volume prune -f 2>/dev/null
docker network prune -f 2>/dev/null
