FROM node:14.18.0-alpine as develop-stage

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ make python3

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 4200
CMD ["/app/node_modules/.bin/ng", "serve", "--host", "0.0.0.0", "--disable-host-check"]
