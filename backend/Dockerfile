FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for TypeScript)
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the application exactly like npm start
CMD ["npm", "start"]