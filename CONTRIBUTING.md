# Contributing to Perform10

Thank you for your interest in contributing to Perform10! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

- Before submitting a bug report, check if the issue has already been reported
- Use the bug report template when creating an issue
- Include detailed steps to reproduce the bug
- Add screenshots if applicable
- Specify your operating system and browser

### Suggesting Enhancements

- Before suggesting an enhancement, check if it has already been suggested
- Use the feature request template when creating an issue
- Clearly explain the feature and its benefits
- Include mockups or diagrams if applicable

### Pull Requests

1. Fork the repository
2. Create a new branch for your feature or bugfix
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Add or update tests as necessary
5. Run the test suite to ensure everything passes
   ```bash
   npm run test
   ```
6. Commit your changes using conventional commit messages
   ```bash
   git commit -m "feat: add new feature"
   ```
7. Push to your branch
   ```bash
   git push origin feature/your-feature-name
   ```
8. Submit a pull request to the `develop` branch

## Development Setup

### Backend

1. Navigate to the backend directory
   ```bash
   cd backend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Copy the `.env.example` file to `.env` and fill in the required values
   ```bash
   cp .env.example .env
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

### Frontend

1. Navigate to the frontend directory
   ```bash
   cd frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Copy the `.env.example` file to `.env` and fill in the required values
   ```bash
   cp .env.example .env
   ```

4. Start the development server
   ```bash
   npm start
   ```

## Coding Standards

### JavaScript/TypeScript

- Use ES6+ features
- Follow the Airbnb JavaScript Style Guide
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Keep functions small and focused
- Use async/await for asynchronous code

### React

- Use functional components with hooks
- Keep components small and focused
- Use the Context API for state management
- Follow the container/presentational component pattern
- Use React Router for navigation
- Write meaningful test cases

### API Design

- Follow REST principles
- Use appropriate HTTP methods (GET, POST, PUT, DELETE)
- Return appropriate HTTP status codes
- Use consistent naming conventions
- Version your APIs

## Git Workflow

- `main` branch: production-ready code
- `develop` branch: next release development
- Feature branches: `feature/feature-name`
- Bugfix branches: `bugfix/bug-name`
- Hotfix branches: `hotfix/fix-name`

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding or correcting tests
- `build`: Changes to the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify source or test files

Example: `feat(auth): add email verification`

## License

By contributing to Perform10, you agree that your contributions will be licensed under the project's MIT license.
