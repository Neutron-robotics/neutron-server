ARG GITHUB_TOKEN
FROM node:18.16.0-alpine as base
ARG GITHUB_TOKEN

ENV GITHUB_TOKEN $GITHUB_TOKEN

# Use the github token for accessing private package repository
RUN echo //npm.pkg.github.com/:_authToken=$GITHUB_TOKEN >> ~/.npmrc
RUN echo @[neutron-robotics]:registry=https://npm.pkg.github.com/ >> ~/.npmrc

# Add package file
COPY package.json ./
COPY package-lock.json ./
COPY scripts/dev.sh ./scripts/dev.sh

# Install deps
RUN npm install

# Remove the private token from the npmrc
RUN echo > ~/.npmrc

# Copy source
COPY src ./src
COPY tsconfig.json ./tsconfig.json
COPY dependencies ./dependencies

# Build dist
RUN npm run build

# Start production image build
FROM node:18.16.0-alpine

# Copy node modules and build directory
COPY --from=base ./node_modules ./node_modules
COPY --from=base /dist /dist
COPY --from=base ./dependencies ./dependencies

# Expose port 3000
EXPOSE 3000
CMD ["dist/server.js"]
