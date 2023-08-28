all: up

up:
	docker-compose up --build

install:
	cd backend && pnpm install
	cd frontend && pnpm install

destroy:
	sh destroy.sh

.PHONY: all

.SILENT:
