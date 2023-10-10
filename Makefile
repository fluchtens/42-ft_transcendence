all: run

install:
	cd backend && npm install && npx prisma generate
	cd frontend && npm install

run:
	docker-compose up --build

clean:
	sh destroy.sh

fclean: clean
	docker system prune -a

.PHONY: all

.SILENT:
