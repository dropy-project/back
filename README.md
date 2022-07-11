## Dropy backend : 

### Préconditions : 
- Node ^16

- Docker

### Installation : 

- Setup le fichier .env

- Installer les dépendances : `npm i`

- A la racine du projet toujours, lancer : `npm run prisma:generate`

### Lancer en développement :

- Lancer la BD locale via : `sudo docker-compose up postgres`

- Lancer le serveur node (API) : `npm run dev`

### Lancer en production :

- Vérifier le .env

- Build les conteneurs docker : `docker-compose build`

- Lancer docker-compose : `docker-compose up -d`

- Push la bd dans le conteneur postgres :
    - `docker exec -it api /bin/bash`
    - `npx prisma db push` 

### Effectuer une migration :

> Si le chema de la BD doit être modifié

- En production
    - lancer docker-compose `docker-compose up`
    - entrer dans le conteneur de l'API : `docker exec -it api /bin/bash`
    - effectuer la migration : `npm run prisma:migrate`

- En développement
    - lancer la base de donnée `docker-compose up postgres`
    - effectuer la migration : `npm run prisma:migrate`

### Variables d'environnement : 
```

NODE_ENV=<production|development>

#################-> API

API_PORT=3000
SOCKET_API=4000

SECRET_KEY=<secret>

#################-> POSTGRES

POSTGRES_USER=<user>
POSTGRES_PASSWORD=<password>
POSTGRES_DB=<database name>

DATABASE_URL: 'postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}'

#################-> NOTIFICATIONS

APN_KEYID=<apple push notification>
APN_TEAMID=<apple push notification>
FCM_KEY=<firebase cloud messaing token>

#################
```



