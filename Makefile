all: build

install:
	cd backend && npm install && npx prisma generate
	cd frontend && npm install

build: clean
	docker-compose up --build

up:
	docker-compose down
	docker-compose up

down:
	docker-compose down --rmi all --volumes

clean: down
	docker system prune -a -f

.PHONY: all install build up down clean

.SILENT:
