# Claude instructions

Read DESIGN.md and PROPOSAL.md before working on the code.

ALWAYS run eslint before committing.

ALWAYS update DESIGN.md before committing, reflecting any changes made.

## Common Issues and Solutions

### TypeScript and ESLint Errors

1. **Avoid using `any` type**: TypeScript's strict mode is enabled. Never use `any` type in catch blocks or elsewhere. Instead:
   - For error handling: `catch (error)` without type annotation, then use type guards
   - For Prisma errors: `if (error instanceof Error && 'code' in error)`
   - For unknown types: Use `unknown` and type guards to narrow the type

2. **Parameter typing in Next.js routes**: When using route parameters, remember they are NOT promises in newer Next.js versions. Use:
   ```typescript
   // Correct
   { params }: { params: { id: string } }
   
   // Incorrect (old pattern)
   { params }: { params: Promise<{ id: string }> }
   ```

3. **Environment variable checks**: Always validate environment variables exist before using them:
   ```typescript
   if (!process.env.SOME_VAR) {
     console.warn('SOME_VAR not set');
     return;
   }
   ```

### Testing and CI

- CI may run with stricter ESLint rules than local development
- Always run `npm run lint` AND `npx tsc --noEmit` before committing
- Fix all TypeScript errors even if they seem minor - CI will catch them
