# Building and testing

- Use LSP to check for correctness. The code should not contain any errors or warnings.
- Use `pnpm build` to check that the code compiles.
- Use `pnpm test` to run tests.

# Coding style

## Tests

- Avoid duplication. Don't write tests that are completely contained within another test.
- After performing an action, test for the values of all relevant properties.
- Besides the basic, also test some more complex cases.
