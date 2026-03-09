# Lightweight Nginx web server as base
FROM nginx:alpine

# Copy app/ folder into Nginx's web root
COPY app/ /usr/share/nginx/html/

# Open port 80 for HTTP traffic
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
