# Match Simulator - Coding Guidelines

## Project Structure

### Directory Organization
```
src/
  features/               # Feature-based modules
    {feature-name}/       # e.g., championship, team, match
      components/        # Feature-specific components
      hooks/            # Custom hooks for this feature
      services/         # API calls and business logic
      types/            # TypeScript types/interfaces
      utils/            # Utility functions
      index.ts          # Public API for the feature
  
  shared/                # Shared components and utilities
    components/         # Reusable UI components
    hooks/              # Global reusable hooks
    utils/              # Shared utility functions
    constants/          # App-wide constants
    
  services/              # Global services and API clients
    api/                # API configuration and clients
    {service-name}/     # Service-specific implementations
    
  store/                 # Global state management
    slices/             # Redux slices (if using Redux)
    context/            # React context providers
    
  assets/               # Static assets that need processing
    images/            # Image assets
    icons/             # SVG icons as React components
    styles/            # Global styles and themes
    
  config/               # Application configuration
    app.ts             # App-wide settings
    routes.ts          # Route definitions
    theme.ts           # Theme configuration
    
  types/                # Global type definitions
    index.ts           # Re-export all types
    {domain}.ts        # Domain-specific types
    
  __tests__/            # Test utilities and setup
    mocks/             # Global test mocks
    utils/             # Test utilities
    setup.ts           # Test setup file
```

## TypeScript Guidelines

### Type Definitions
- All types/interfaces go in the `types` directory, organized by domain
- Use `type` for simple type aliases and `interface` for object shapes that may be extended
- Always explicitly type function parameters and return values
- Use `readonly` for immutable properties
- Prefer `type` over `interface` for union/intersection types

### Naming Conventions
- Use PascalCase for type/interface names (e.g., `TeamStanding`)
- Use camelCase for variables and functions
- Use UPPER_CASE for constants
- Prefix interfaces with `I` only when necessary for disambiguation
- Suffix component props with `Props` (e.g., `TeamCardProps`)

## React Components

### Component Structure
1. Props type definition
2. Component definition
3. Local state and hooks
4. Event handlers
5. Side effects
6. Render method

### Component Guidelines
- Prefer functional components with hooks
- Keep components small and focused (Single Responsibility Principle)
- Extract complex logic into custom hooks
- Use React.memo() for performance optimization when needed
- Destructure props at the top of the component
- Use default props or default parameter values

## State Management

### Context API
- Create separate contexts for different domains
- Keep context providers as close to where they're needed as possible
- Split large contexts into smaller, focused ones
- Use useReducer for complex state logic

### State Updates
- Never mutate state directly
- Use functional updates when the new state depends on the previous state
- Batch multiple state updates when possible

## Styling

### Primary Styling Solution
- **Use TailwindCSS as the primary styling solution**
- Prefer utility classes for styling components
- Use `@apply` in CSS only for repeated utility patterns
- Keep custom CSS to a minimum

### When to Use Custom CSS
- Only use custom CSS when Tailwind utilities cannot achieve the desired result
- When custom CSS is necessary, prefer CSS Modules over global styles
- Document the reason for any custom CSS

### Theming
- Extend Tailwind's theme in `tailwind.config.js` for project-specific design tokens
- Use CSS variables for theming when needed
- Keep global styles minimal and focused on base elements

## Testing

### Test Structure
- Place test files next to the code they test with `.test.tsx` extension
- Use `describe` blocks to group related tests
- Follow the Arrange-Act-Assert pattern
- Test behavior, not implementation

### Testing Guidelines
- Write unit tests for pure functions and custom hooks
- Write integration tests for component interactions
- Use MSW for API mocking
- Keep tests simple and focused
- Test edge cases and error states

## Code Quality

### Linting
- Use ESLint with TypeScript support
- Enable strict TypeScript checks
- Use Prettier for code formatting
- Set up pre-commit hooks for linting and formatting

### Documentation
- Document complex business logic
- Add JSDoc comments for public APIs
- Keep README.md up to date
- Document component props with TypeScript interfaces

## Performance

### Optimization Techniques
- Use React.memo for expensive renders
- Use useCallback and useMemo appropriately
- Implement code splitting
- Lazy load routes and heavy components
- Optimize images and assets

## Git Workflow

### Branch Naming
- `feature/` - New features
- `bugfix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation changes

### Commit Messages
- Use conventional commits format: `type(scope): description`
- Types: feat, fix, docs, style, refactor, test, chore
- Keep the first line under 72 characters
- Include a body for complex changes

## Continuous Integration

### Pipeline
- Run tests on every push
- Enforce code coverage thresholds
- Run type checking
- Build the application
- Run linters and formatters

## Dependencies

### Management
- Keep dependencies up to date
- Use exact versions in package.json
- Audit dependencies regularly
- Document why each dependency is needed

## Error Handling

### Approach
- Use error boundaries for React component errors
- Implement proper error types
- Provide meaningful error messages
- Log errors appropriately
- Handle async errors with try/catch

### Error Boundaries
- Create error boundaries for major UI sections
- Display user-friendly error messages
- Include a way to recover or retry

## Accessibility

### Guidelines
- Use semantic HTML
- Add proper ARIA attributes
- Ensure keyboard navigation
- Test with screen readers
- Maintain sufficient color contrast

## Internationalization

### Implementation
- Extract all user-facing strings
- Use a library like react-i18next
- Store translations in JSON files
- Support RTL languages if needed

## Security

### Best Practices
- Sanitize user input
- Use Content Security Policy
- Protect against XSS and CSRF
- Use environment variables for sensitive data
- Implement proper authentication and authorization

## Performance Monitoring

### Tools
- Use React DevTools Profiler
- Implement performance metrics
- Monitor bundle size
- Track runtime performance

## Code Review

### Process
- Request reviews from at least one team member
- Keep PRs small and focused
- Provide constructive feedback
- Address all comments before merging
- Use PR templates

### Checklist
- [ ] Code is clean and follows style guide
- [ ] Tests are passing
- [ ] Documentation is updated
- [ ] No console.log statements in production code
- [ ] No commented-out code
- [ ] No sensitive data exposed
