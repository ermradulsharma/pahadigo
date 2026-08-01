# Contributing to PahadiGo

First off, thank you for considering contributing to PahadiGo! It's people like you that make PahadiGo a great platform.

Please take a moment to review this document in order to make the contribution process easy and effective for everyone involved.

## Code of Conduct

This project and everyone participating in it is governed by the [PahadiGo Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for PahadiGo. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

- Use a clear and descriptive title for the issue to identify the problem.
- Describe the exact steps which reproduce the problem in as many details as possible.
- Provide specific examples to demonstrate the steps. Include links to files or GitHub projects, or copy/pasteable snippets, which you use in those examples.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for PahadiGo, including completely new features and minor improvements to existing functionality.

- Use a clear and descriptive title for the issue to identify the suggestion.
- Provide a step-by-step description of the suggested enhancement in as many details as possible.
- Describe the current behavior and explain which behavior you expected to see instead and why.

### Pull Requests

Please follow these steps to have your contribution considered by the maintainers:

1. Follow all instructions in the template.
2. Follow the styleguides and standards in the project.
3. After you submit your pull request, verify that all status checks are passing.

## Local Development Setup

To set up your local development environment:

1. Clone the repository:
   ```bash
   git clone https://github.com/ermradulsharma/pahadigo.git
   cd pahadigo
   ```

2. Install dependencies (requires Node.js >=18.17.0):
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy the `.env.example` file to `.env` and fill in the required values.
   ```bash
   cp .env.example .env
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

5. Linting and Testing:
   Ensure your code passes all linting and testing requirements before submitting a PR:
   ```bash
   npm run lint
   npm test
   ```

## License Notice

Please note that this project is distributed under a Proprietary License. By contributing to this project, you agree that your contributions will be bound by the project's [LICENSE](LICENSE.md).
