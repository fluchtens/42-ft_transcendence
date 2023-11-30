all: build

backend/src/game/gameLogic.ts: 
	ln shared/gameLogic.ts backend/src/game/

frontend/src/components/gameLogic.ts:
	ln shared/gameLogic.ts frontend/src/components/

share: | backend/src/game/gameLogic.ts frontend/src/components/gameLogic.ts

install:
	cd backend && npm install && npx prisma generate
	cd frontend && npm install

build: clean share
	docker-compose up --build

up: share
	docker-compose down
	docker-compose up

down:
	docker-compose down --rmi all --volumes

clean: down
	rm -rf backend/prisma/migrations
	rm -rf backend/uploads
	docker system prune -a -f

.PHONY: all install build up down clean share

.SILENT:
