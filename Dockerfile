FROM registry.cn-shenzhen.aliyuncs.com/shikanon/puppeteer:base

COPY . /app
WORKDIR /app

# Install Puppeteer under /node_modules so it's available system-wide
RUN npm install

EXPOSE 8000

CMD ["node", "main.js"]