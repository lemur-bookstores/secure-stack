# Deployment Strategies

SecureStack applications can be deployed to various environments, from traditional VPS to modern serverless and container orchestration platforms.

## Docker Deployment

The most common way to deploy SecureStack is using Docker.

### Dockerfile

```dockerfile
# Base stage
FROM node:18-alpine AS base
WORKDIR /app
RUN npm install -g turbo

# Prune stage
FROM base AS pruner
COPY . .
RUN turbo prune --scope=@lemur-bookstores/server --docker

# Builder stage
FROM base AS builder
COPY --from=pruner /app/out/json .
COPY --from=pruner /app/out/pnpm-lock.yaml .
RUN npm install -g pnpm && pnpm install

COPY --from=pruner /app/out/full .
RUN turbo run build --filter=@lemur-bookstores/server...

# Runner stage
FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app .

CMD ["node", "apps/server/dist/index.js"]
```

## Kubernetes (K8s)

For scaling and orchestration, Kubernetes is recommended.

### Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secure-stack-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: secure-stack-api
  template:
    metadata:
      labels:
        app: secure-stack-api
    spec:
      containers:
      - name: api
        image: my-registry/secure-stack-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: url
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
```

## Serverless (AWS Lambda)

SecureStack can run on AWS Lambda using `@fastify/aws-lambda`.

### Adapter

```typescript
// lambda.ts
import awsLambdaFastify from '@fastify/aws-lambda';
import { app } from './app'; // Your SecureStack instance

export const handler = awsLambdaFastify(app.server);
```

## Environment Variables

Ensure these variables are set in your production environment:

- `NODE_ENV`: Set to `production`.
- `PORT`: The port to listen on.
- `DATABASE_URL`: Connection string for your database.
- `JWT_SECRET`: Secret key for signing tokens.
- `MESH_SECRET`: Secret for service mesh auth (if used).

## CI/CD Pipeline (GitHub Actions)

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Build
        run: pnpm build
        
      - name: Test
        run: pnpm test
        
      - name: Build Docker image
        run: docker build -t my-app .
        
      - name: Push to Registry
        run: docker push my-app
```
