# Tests Directory

This directory contains all testing files organized by testing type and scope.

## Structure

- `unit/` - Unit tests for individual functions and components
- `integration/` - Integration tests for service interactions
- `e2e/` - End-to-end tests for complete user workflows
- `performance/` - Performance and load testing files

## Testing Standards

- Maintain high test coverage (>90% for critical paths)
- Use descriptive test names that explain the scenario
- Follow AAA pattern: Arrange, Act, Assert
- Mock external dependencies appropriately
- Include both positive and negative test cases

## Test Organization

- Mirror the source code directory structure
- Use meaningful describe blocks to group related tests
- Include setup and teardown procedures
- Document complex test scenarios with comments

## Test Types

- **Unit Tests**: Fast, isolated tests for individual components
- **Integration Tests**: Tests for component interactions and API endpoints
- **E2E Tests**: Full application workflow tests from user perspective
- **Performance Tests**: Load, stress, and benchmark tests
