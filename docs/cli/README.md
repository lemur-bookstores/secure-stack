# @lemur-bookstores/secure-stack-cli

The official CLI tool for SecureStack, designed to streamline the development of secure, type-safe applications.

## Installation

```bash
npm install -g @lemur-bookstores/secure-stack-cli
```

## Usage

```bash
securestack <command> [options]
```

## Commands

### Project Creation

#### `create <project-name>`
Creates a new SecureStack project with interactive setup.

```bash
securestack create my-app
```

Options:
- `-t, --template <template>`: Project template (monolith, microservices, hybrid)
- `--skip-install`: Skip dependency installation
- `--skip-prompts`: Skip interactive prompts

#### `init`
Initialize SecureStack in an existing project.

```bash
securestack init
```

### Code Generation

#### `generate service <name>`
Generates a new service with CRUD operations, router, and middleware.

```bash
securestack generate service user
```

#### `generate module <name>`
Generates a basic module structure.

```bash
securestack generate module auth
```

#### `generate router <name>`
Generates a router with query and mutation stubs.

```bash
securestack generate router posts
```

#### `generate middleware <name>`
Generates a middleware template.

```bash
securestack generate middleware logging
```

### Development

#### `dev`
Starts the development server with hot reload.

```bash
securestack dev
securestack dev --port 4000
```

#### `build`
Builds the project for production.

```bash
securestack build
securestack build --minify
```

### Service Mesh

#### `mesh visualize`
Visualizes the service mesh topology.

```bash
securestack mesh visualize
```

#### `mesh status`
Shows the status of a service.

```bash
securestack mesh status --url http://localhost:3000
```

#### `mesh health`
Runs health checks on a service.

```bash
securestack mesh health --url http://localhost:3000
```

#### `mesh rotate-keys`
Manually rotates encryption keys for a service.

```bash
securestack mesh rotate-keys --url http://localhost:3000
```

### Deployment

#### `docker`
Generates Dockerfile and docker-compose.yml.

```bash
securestack docker
```

#### `deploy`
Runs deployment scripts defined in package.json.

```bash
securestack deploy
```

## License

MIT
