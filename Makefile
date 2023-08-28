all: up

install:
	cd backend && pnpm install
	cd frontend && pnpm install

run:
	docker-compose up --build

rund:
	docker-compose up --build -d

clean:
	sh destroy.sh

.PHONY: all

.SILENT:
