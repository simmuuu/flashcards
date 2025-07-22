FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

COPY . .

# Build the application
RUN pnpm run build

ENV NODE_ENV=production

EXPOSE 3000

# Start the server
CMD ["pnpm", "start"]
