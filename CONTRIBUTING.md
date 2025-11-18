# Contributing to Smart Building Dashboard

Thank you for your interest in contributing to the Smart Building Dashboard project! We welcome contributions from the community.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Your environment (OS, browser, Node version)

### Suggesting Features

Feature requests are welcome! Please create an issue describing:
- The problem your feature would solve
- Your proposed solution
- Alternative solutions you've considered

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/Nath333/smart-building-dashboard.git
   cd smart-building-dashboard
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add JSDoc comments for new functions
   - Test your changes locally

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   Use conventional commits:
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation changes
   - `style:` formatting changes
   - `refactor:` code refactoring
   - `test:` adding tests
   - `chore:` maintenance tasks

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request on GitHub

## Development Setup

```bash
# Install dependencies
npm install

# Start development server (frontend only)
npm run dev

# Start full-stack (frontend + backend)
npm run dev:fullstack

# Run linter
npm run lint

# Build for production
npm run build
```

## Code Style Guidelines

### JavaScript
- Use ES6+ features
- Prefer `const` over `let`, avoid `var`
- Use arrow functions for callbacks
- Add JSDoc comments for functions and classes
- Keep functions small and focused

### React
- Use functional components with hooks
- Use `memo()` for performance optimization when needed
- Add `aria-*` attributes for accessibility
- Keep components focused on single responsibility

### CSS
- Use CSS custom properties for theming
- Follow BEM naming convention
- Keep selectors specific but not overly nested
- Ensure responsive design (mobile-first)

## Project Structure

```
src/
├── components/     # React components
├── services/       # API and data services
├── App.jsx         # Main app component
└── App.css         # Application styles

backend/
├── routes/         # Express routes
├── services/       # Business logic
└── utils/          # Utilities

shared/
├── types.js        # Shared type definitions (JSDoc)
└── config.js       # Shared configuration
```

## Testing Guidelines

- Test your changes in both development and production builds
- Verify the app works with mock data (GitHub Pages)
- Test accessibility with screen readers when possible
- Check responsive design on different screen sizes

## Questions?

Feel free to open an issue for questions or join discussions in existing issues.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
