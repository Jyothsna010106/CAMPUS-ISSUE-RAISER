FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY frontend/package*.json ./frontend/

RUN npm install && npm --prefix frontend install

COPY . .

ENV STORE_MODE=mongo
ENV MONGO_URI=mongodb://mongo:27017/campus_issue

EXPOSE 5000 5001 5002 5003 5004 5005 5006 5007 5008 5173

CMD ["npm", "run", "dev:full"]
