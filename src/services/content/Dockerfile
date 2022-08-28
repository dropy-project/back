FROM node:16
RUN npm install -g --unsafe-perm prisma

RUN mkdir /app
WORKDIR /app

COPY ../../../ /app

RUN npm init -y
RUN npx prisma generate

EXPOSE 6000

CMD [ "npm", "run", "content" ]
