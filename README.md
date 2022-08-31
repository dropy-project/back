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
NODE_ENV=development

#################

API_PORT=3000
SOCKET_PORT=4000
CONTENT_PORT=6000
STUDIO_PORT=5555

POSTGRES_EXPOSE_PORTS=127.0.0.1:5432:5432
# En developpement = 127.0.0.1:5432:5432 (Exposition sur la machine de développement) 
# En production = 5432 (Port restreint au réseau virtuel du docker compose)

#################

CONTENT_URL_PREFIX=http://localhost:${CONTENT_PORT}

#################

ACCESS_SECRET_KEY=""
REFRESH_SECRET_KEY=""

CHAT_ENCRYPTION_SECRET_KEY=""

#################-> POSTGRES


POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=postgres

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}"

#################-> NOTIFICATIONS

APN_KEYID=
APN_TEAMID=
FCM_KEY=

#################
```



