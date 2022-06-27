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
- Ajouter le certificat pour les notifications push nommé "certNotification.p8" à la racine du projet (Discord channel env-keys)
- Lancer : `npm run dev`

### Variables d'environnement : 
- DATABASE_URL : l'url de la base de données
- PORT : port de l'api
- SECRET_KEY : secret pour encoder le token
- BD_PASSWORD : mot de passe de la base donnée
- APN_KEYID : keyid pour l'apple push notification
- APN_TEAMID : teamid pour l'apple push notification

### Visualisation des données de la BD
- Le port est 5432, le host localhost et le nom de la BD postgres



