FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for building)
RUN pnpm install --no-frozen-lockfile

COPY . .

# Build the application
RUN pnpm run build

# Remove devDependencies and reinstall only production dependencies
RUN pnpm install --no-frozen-lockfile --prod

ENV NODE_ENV=production

EXPOSE 3000

# Start the server
CMD ["pnpm", "start"]
