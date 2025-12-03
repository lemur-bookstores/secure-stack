# Contributing to SecureStack

Thank you for your interest in contributing to SecureStack! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 20+ or Bun 1.0+
- npm (comes with Node.js)
- Git

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/secure-stack.git
   cd secure-stack
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Build all packages:
   ```bash
   npm run build
   ```

5. Run tests:
   ```bash
   npm run test
   ```

## Monorepo Structure

This project uses **Turborepo** for managing the monorepo. Each package is located in the `packages/` directory.

### Available Commands

```bash
# Build all packages
npm run build

# Run all packages in dev mode
npm run dev

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run typecheck
```

### Working on a specific package

```bash
# Build a specific package
npm run build --workspace=packages/core

# Run dev mode for a specific package
npm run dev --workspace=packages/core

# Run tests for a specific package
npm run test --workspace=packages/core
```

## Code Style

- We use **TypeScript** for all code
- We use **Prettier** for code formatting
- We use **ESLint** for linting
- We follow **Conventional Commits** for commit messages

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Example:
```
feat(core): add middleware composition support

Implemented middleware composition using the compose pattern.
This allows multiple middlewares to be combined into a single middleware.

Closes #123
```

## Pull Request Process

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them following the commit message format

3. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Open a Pull Request on GitHub

5. Ensure all checks pass (tests, linting, type checking)

6. Wait for code review

### PR Requirements

- [ ] All tests pass
- [ ] Code is properly formatted
- [ ] No linting errors
- [ ] Type checking passes
- [ ] Documentation is updated (if applicable)
- [ ] Commit messages follow the convention
- [ ] PR description clearly describes the changes

## Testing

- Write tests for all new features
- Ensure all tests pass before submitting a PR
- Aim for >80% code coverage

## Documentation

- Update README files when adding new features
- Add JSDoc comments to all public APIs
- Update the roadmap if adding significant features

## Questions?

If you have questions, feel free to:
- Open an issue
- Join our Discord community (link coming soon)
- Email the maintainers

## License

By contributing to SecureStack, you agree that your contributions will be licensed under the MIT License.
