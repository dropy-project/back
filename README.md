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
    - lancer docker-compose `docker-compose up -d`
    - entrer dans le conteneur de l'API : `docker exec -it <nom_conteneur_api> /bin/bash`
    - effectuer la migration : `npx prisma migrate deploy`

- En développement
    - lancer la base de donnée `docker-compose up postgres`
    - Option 1. Créer une migration : `npx prisma migrate dev`
    - Option 2. Appliquer une migration déjà existante `npx prisma migrate deploy`

### Deployer en production

- Mettre à jour le fichier `version.json`
- Commit la version et créer un tag git
- Rebase la branche production et push
- Sur le vps : pull la branche et build puis lancer docker-compose

### Ajouter une route à la doc 
> Dans le fichier src/resources/swagger/routesDoc.json

- Les routes s'ajoutent au niveau de l'objet "paths"
- On ajoute le nom de la route comme un objet "test/truc": {}
- Il faut donner un "tag" pour choisir dans quelle catégorie sera inscrit notre route (API - User, API - Auth, CONTENT, ...)
- Lorsque les réponses sont complexes, on utilise les schemas en bas du json. Ils sont en suite appelé avec le $ref

***Exemple route avec paramètre URL*** :

Si c'est des paramètres d'URL sont nécessaire on les note de cette façon : 

> Dans le tableau "parameters" on peut retrouver des paramètres de "path" : ceux de l'URL. Mais aussi des paramètres "header", comme l'Authorization

    "dropy/{id}" : {
        "get": {
            "tags": [
                "API - Dropy"
            ],
            "description": "Une route qui donne les infos du dropy qui correspond à l'id";
            "parameters": [
                {
                    "name": "id",
                    "in": "path",
                    "description": "L'id du dropy",
                    "required": true,
                    "schema": {
                        "type": "integer"
                    }
                },
                {
                    "name": "Authorization",
                    "in": "header",
                    "description": "Le token d'accés de l'utilisateur",
                    "required": true,
                    "schema": {
                        "type": "string"
                    }
                }
            ],
            "responses": {
                "200": {
                    "description": "Les infos du drop",
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/DropyAroundSimplifiedUser"
                            }
                        }
                    }
                },
                "404": {
                    "description": "Aucun drop avec l'id donné n'est présent dans la base de donnée"
                }
            }
        }
    },

***Exemple route avec body***

> On rajoute un objet "requestBody"

    "user/changePassword" : {
        "post": {
            "tags": [
                "API - User"
            ],
            "description": "Une route qui change le mot de passe du user connecté";
            "parameters": [
                {
                    "name": "Authorization",
                    "in": "header",
                    "description": "Le token d'accés de l'utilisateur",
                    "required": true,
                    "schema": {
                        "type": "string"
                    }
                }
            ],
            "requestBody": {
                "description": "Le nouveau mot de passe",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "password": {
                                    "type": "string"
                                }
                            }
                        }
                    }
                },
                "required": true
            },
            "responses": {
                "200": {
                    "description": "Mot de passe modifié",
                },
            }
        }
    },

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

# Dans le cas ou le projet est lancé à 100% au travers de docker-compose, remplacer localhost par content
CONTENT_URL_LOCAL=http://localhost:${CONTENT_PORT}

CONTENT_URL_PUBLIC=http://localhost:${CONTENT_PORT}

#################

ACCESS_SECRET_KEY=""
REFRESH_SECRET_KEY=""
RESET_PASSWORD_SECRET_KEY=""

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

#################-> MAIL

MAIL_ADDRESS=
MAIL_PASSWORD=

#################-> WEBHOOKS 

# Que pour la prod
DISCORD_WEBHOOK_ERROR=""

#################
```



