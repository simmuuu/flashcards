FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy the built JavaScript files
COPY dist/ ./dist/

ENV NODE_ENV=production

EXPOSE 3000

# Start the server directly with node (no need to build)
CMD ["node", "dist/index.js"]
