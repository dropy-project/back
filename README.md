## Setup projet : 

### Préconditions : 
- Installer Docker : `sudo apt install docker` pour MacOS installer Docker desktop
- Avoir une version de Node correcte
- Installer un client Postgres quelconque (Exemple : Beekeeper studio)

### Installation : 
- Clone le projet
- Installer les dépendances via : `npm i`
- Lancer la BD Locale via : `sudo docker-compose up postgres` ne pas oublier le postgres à la fin !
- Télécharger les deux .env sur Discord channel : env-back et les ajouter à la racine du projet
- A la racine du projet toujours, lancer : `npm run prisma:migrate`
- Lancer : `npm run dev`

### Variables d'environnement : 
- DATABASE_URL : l'url de la base de données
- PORT : port de l'api
- TOKEN_SECRET_KEY : secret pour encoder le token

### Visualisation des données de la BD
- Le port est 5432, le host localhost et le nom de la BD postgres



