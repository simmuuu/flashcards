FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy the built JavaScript files
COPY dist/ ./dist/

ENV NODE_ENV=production

EXPOSE 3000

# Start the server directly with node (no need to build)
CMD ["node", "dist/index.js"]
