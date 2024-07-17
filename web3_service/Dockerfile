FROM node:alpine


WORKDIR /app

COPY package.json .
RUN npm install

COPY .env .
 
COPY build ./build


CMD ["npm", "start"]