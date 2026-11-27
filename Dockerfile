FROM nginx:1.27-alpine
COPY index.html sw.js manifest.webmanifest icon-*.png /usr/share/nginx/html/
