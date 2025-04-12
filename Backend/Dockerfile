# Use Bun as base image
FROM oven/bun:1

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Copy .env file from db folder
COPY db/.env .env

# Generate Prisma client
RUN bun run db:generate

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["bun", "index.ts"] 