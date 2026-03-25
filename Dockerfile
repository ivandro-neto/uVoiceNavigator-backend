# Base image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Install dependencies for building
# If you have native dependencies like python or make, add them here
# RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install production dependencies and system requirements (Prisma needs openssl)
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install

# Copy built application and prisma schema from builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/prisma ./prisma

# Expose the application port (adjust if necessary, default NestJS is 3000)
EXPOSE 3000

# Set environment variables (can be overridden at runtime)
ENV NODE_ENV=development

# Command to run the application
CMD ["npm", "run", "start:dev"]
