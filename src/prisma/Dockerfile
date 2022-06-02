FROM node:16
RUN npm install -g --unsafe-perm prisma

RUN mkdir /app
WORKDIR /app

COPY ./* ./prisma/

RUN npm init -y
RUN npm install @prisma/photon

CMD [ "npx", "prisma", "studio" ]

EXPOSE 5555