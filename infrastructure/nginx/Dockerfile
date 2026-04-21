FROM nginx:1.27.4

RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*

COPY nginx.conf /etc/nginx/nginx.conf
COPY certs /etc/nginx/certs




