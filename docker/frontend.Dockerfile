# Use a Node image to build
FROM node:20 AS builder
WORKDIR /app

# Install dependencies and build
COPY ./frontend/package.json ./
RUN npm install
COPY ./frontend .
RUN npm run build

# Use a lightweight image to serve (nginx for example)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

# Start Nginx when the container starts
CMD ["nginx", "-g", "daemon off;"]