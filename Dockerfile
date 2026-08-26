# MiTutor — app completa (Tutor IA + llave permanente) servida con Node
FROM node:20-alpine
WORKDIR /app
COPY index.html .
COPY server.js .
EXPOSE 3000
CMD ["node", "server.js"]
