all: run

install:
	cd backend && npm install && npx prisma generate
	cd frontend && npm install

run: down
	docker-compose up --build

down:
	docker-compose down --rmi all --volumes

clean:
	sh destroy.sh

fclean: clean
	docker system prune -a

.PHONY: all

.SILENT:
