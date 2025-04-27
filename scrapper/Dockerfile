FROM node:23-slim
WORKDIR /app

RUN apt-get update && apt-get install -y \
    ca-certificates fonts-liberation wget gnupg \
    libasound2 libatk-bridge2.0-0 libatk1.0-0 libgtk-3-0 \
    libnotify-dev libgconf-2.4 libnss3 libxss1 \
    libxcomposite1 libxdamage1 libxext6 libxrandr2 \
    libgbm1 libglib2.0-0 libpango-1.0-0 libpangocairo-1.0-0 \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3001
CMD ["node", "index.js"]
