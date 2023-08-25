all: up

up:
	docker-compose up --build

destroy:
	sh destroy.sh

.PHONY: all

.SILENT:
