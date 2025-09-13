FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code and templates
COPY src/ ./src/
COPY templates/ ./templates/

# Build the project
RUN npm run build

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S speckit -u 1001

USER speckit

EXPOSE 3000

CMD ["node", "dist/index.js"]