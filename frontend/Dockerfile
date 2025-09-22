FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for Angular CLI)
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 4200

# Start the application exactly like npm start
CMD ["npm", "start"]