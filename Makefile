all: build

install:
	cd backend && npm install && npx prisma generate
	cd frontend && npm install

build: clean
	docker-compose up --build

up:
	docker-compose up

down:
	docker-compose down --rmi all --volumes

clean: down
	rm -rf backend/prisma/migrations
	rm -rf backend/uploads
	docker system prune -a

.PHONY: all

.SILENT:
