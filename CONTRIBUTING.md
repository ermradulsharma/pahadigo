# Contributing to PahadiGo

We love contributions! To maintain code quality and architectural integrity, please follow these guidelines.

## 🏗️ Architectural Guidelines

### Service Layer Pattern

- **Controllers** should be "thin". They handle requests, validate inputs, and delegate logic to services.
- **Services** (in `src/services/`) should contain all business logic. They should be independent of the HTTP request object.
- **Models** should define the schema and basic validation.

### Formatting & Linting

- Follow the existing ESLint configuration.
- Use meaningful variable and function names.
- Keep functions small and focused.

## 🧪 Testing Requirements

- Every new feature should include unit tests for its Service.
- API changes require updated integration tests in `tests/api/`.
- Ensure all tests pass before submitting a PR:
  ```bash
  npm test
  ```

## 🚀 Pull Request Process

1. Fork the repository and create your branch from `main`.
2. Install dependencies: `npm install`.
3. Make your changes and add tests.
4. Ensure the build passes: `npm run build`.
5. Submit a pull request with a clear description of your changes.

## 🛡️ Security

- Never commit secrets or `.env` files.
- Always use environment variables for sensitive data.
- Validate all user inputs on the server side.
