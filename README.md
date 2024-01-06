# ft_transcendence

### What's this about?
Modern multiplayer pong game web application in React and NestJS. This is the latest project of the 42 common core, involving the creation of a full stack application with multiplayer online pong as its main objective. It includes many features such as a matchmaking system, statistics, game history, friendship system and real-time chat.

### Installation :
- Clone the repository.

### Configuration:
- Create an .env file at the root of the directory and add the following content to it.
- Configure variables for url, api keys, database information, etc.
```env
VITE_BACK_URL=http://localhost:3000
VITE_FRONT_URL=http://localhost
VITE_BACK_PORT=3000

JWT_SECRET=
SESSION_SECRET=

FORTY_TWO_UID=
FORTY_TWO_SECRET=

POSTGRES_DB=transcendence
POSTGRES_USER=admin
POSTGRES_PASSWORD=42
DATABASE_URL=postgresql://admin:42@transcendence-postgres:5432/transcendence
```

### Usage:
- Run ```make``` to start the application in production mode with docker.

### Screenshots:
![1](https://i.imgur.com/Nsrzsc2.png)
![2](https://i.imgur.com/YwahwD5.png)
![3](https://i.imgur.com/Gik9SW4.png)
![4](https://i.imgur.com/tLDHS1j.png)
![5](https://i.imgur.com/w29aA4b.png)
![6](https://i.imgur.com/iTr8PZi.png)
