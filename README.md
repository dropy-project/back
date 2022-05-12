## Setup projet : 

### Préconditions : 
- Installer Docker : 'sudo apt install docker' pour MacOS installer Docker desktop
- Avoir une version de Node correcte
- Installer un client Postgres quelconque (Exemple : Beekeeper studio)

### Installation : 
- Clone le projet
- Installer les dépendances via : `npm i`
- Lancer la BD Locale via : `sudo docker-compose up postgres` ne pas oublier le postgres à la fin !
- Télécharger les deux .env sur Discord channel : env-back et les ajouter à la racine du projet
- A la racine du projet toujours, lancer : `npm run prisma:migrate`
- Lancer : `npm run dev`


### Visualisation des données de la BD
- Les identifiants sont dans le .env
- Le port est 5432, le host localhost et le nom de la BD postgres



