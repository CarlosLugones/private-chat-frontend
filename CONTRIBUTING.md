# Contributing to Private Chat

Thank you for considering contributing to Private Chat! This document provides guidelines and instructions to help you get started.

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported
2. Use the bug report template
3. Include as many details as possible

### Suggesting Features

1. Check if the feature has already been suggested
2. Use the feature request template
3. Explain why this feature would be useful
4. If possible, outline implementation ideas or approaches

### Code Contributions

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

#### Branching Strategy

- `main` - Production-ready code
- `develop` - Development branch for next release
- Feature branches: `feature/your-feature-name`
- Bug fixes: `fix/issue-description`

#### Development Workflow

1. Install dependencies: `bun install`
2. Start the development server: `bun run dev`
3. Make your changes
4. Test your changes locally
5. Ensure linting passes: `bun run lint`
6. Commit with a descriptive message

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code changes that neither fix bugs nor add features
- `chore:` - Changes to the build process or tools

Example: `feat: add dark mode support`

## Pull Request Process

1. Update the README.md with details of your changes if needed
2. Make sure your code follows the existing style
3. Include comments in your code where necessary
4. Update the documentation if necessary
5. Your pull request will be reviewed by maintainers
6. Address any requested changes from code reviews
7. Once approved, your PR will be merged

## Style Guide

- Use ESLint and Prettier for code formatting
- Write clear, readable code with descriptive variable names
- Add comments for complex logic
- Follow the project's established patterns
- Use TypeScript types/interfaces appropriately

## License

By contributing to Private Chat, you agree that your contributions will be licensed under the project's license.

Thank you for contributing!
