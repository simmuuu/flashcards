FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

COPY . .

# Build the application
RUN npm run build

# Remove devDependencies and reinstall only production dependencies
RUN npm ci --omit=dev

ENV NODE_ENV=production

EXPOSE 3000

# Start the server
CMD ["npm", "start"]