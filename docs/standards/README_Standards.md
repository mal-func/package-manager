# README Standards

**Applies to:** All CDIS repositories  
**Purpose:** Define a common standard for writing repository README files.

---

## 1. Purpose of a README

A README is the first place an engineer should look after opening a repository.

It should give a new developer enough information to understand the project and get it running without having to search through the source code or ask someone for basic setup information.

A good README should answer these questions:

- What is this project?
- What problem does it solve?
- What does it contain?
- What technologies are used?
- How do I set it up?
- How do I run it?
- How do I test it?
- Where can I find more documentation?
- Who owns or maintains it?

The README should be **useful first and detailed second**. It should not try to document every part of the system.

---

# 2. General Standard

All project READMEs should follow a common structure so that engineers do not have to learn a different documentation style for every repository.

The recommended flow is:

```text
Project Name
    ↓
Overview
    ↓
Features
    ↓
Technology Stack
    ↓
Architecture
    ↓
Prerequisites
    ↓
Installation
    ↓
Configuration
    ↓
Running the Project
    ↓
Project Structure
    ↓
Testing
    ↓
Development / Contribution
    ↓
Deployment
    ↓
Documentation
    ↓
Troubleshooting
    ↓
Security
    ↓
Ownership / Support
```

Not every project will need every section. Sections that do not apply can be removed.

The important thing is to keep the overall flow consistent.

---

# 3. Project Title

The README should always start with the project name.

```markdown
# CDIS Employee Security Platform
```

Use the official project or repository name.

Avoid generic titles such as:

```text
# Project
# New Project
# Final Version
# Test Project
```

---

# 4. Overview

The first section should briefly explain what the project is and why it exists.

Keep this short. Usually two or three sentences are enough.

Example:

```markdown
## Overview

CDIS Employee Security Platform is a web application used to monitor
employee activity and identify security-related events for review.
It provides administrators with a central dashboard for reviewing
alerts, users, and security activity.
```

A developer should be able to understand the purpose of the project without reading the rest of the README.

---

# 5. Project Status

If the project is still being developed, say so.

Example:

```markdown
## Status

Active Development
```

Other useful statuses may include:

- Production
- Proof of Concept
- Experimental
- Maintenance
- Deprecated
- Archived

Only use a status that accurately represents the project.

---

# 6. Features

List the main things the project can do.

Example:

```markdown
## Features

- Employee activity monitoring
- Security event detection
- Risk-based alerts
- Admin dashboard
- Role-based access control
- Audit logging
```

Keep this focused on major capabilities.

There is no need to list every button, page, helper function, or small feature.

---

# 7. Technology Stack

Mention the main technologies used by the project.

A table works well for this.

```markdown
## Technology Stack

| Area | Technology |
|---|---|
| Frontend | React, TypeScript |
| Backend | Node.js, Express |
| Database | MySQL |
| Styling | Tailwind CSS |
| Testing | Vitest |
| Deployment | Docker |
```

Only include technologies that are actually relevant to understanding or working with the project.

---

# 8. Architecture

For projects with multiple components, provide a simple overview of how the system is put together.

Example:

```markdown
## Architecture

The application follows a client-server architecture.

```text
Browser
   |
   v
React Frontend
   |
   v
REST API
   |
   v
Node.js / Express
   |
   +---- MySQL
   |
   +---- External Services
```
```

The README does not need to contain the complete architecture document.

If the project has detailed architecture documentation, link to it:

```markdown
For more details, see
[Architecture Documentation](docs/architecture.md).
```

---

# 9. Prerequisites

List what a developer needs before setting up the project.

Example:

```markdown
## Prerequisites

Make sure the following are installed:

- Ubuntu 24.04 LTS
- Git
- Node.js 22+
- npm 10+
- MySQL 8+
```

If a particular version is required, mention it.

Do not write only:

```text
Install Node.js.
```

when the project actually depends on a specific version.

---

# 10. Installation

Installation should be written as a sequence of steps that another developer can follow directly.

Example:

```markdown
## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the environment file

```bash
cp .env.example .env
```
```

Keep commands copy-paste friendly.

Do not assume that a new developer already knows project-specific setup steps.

---

# 11. Configuration

If the project needs environment variables or configuration files, document them clearly.

Example:

```markdown
## Configuration

Create the environment file:

```bash
cp .env.example .env
```

Update the values according to your local environment.
```

If there are several variables, use a table:

```markdown
| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Application port |
| `DATABASE_URL` | Yes | Database connection |
| `JWT_SECRET` | Yes | Authentication secret |
| `LOG_LEVEL` | No | Application log level |
```

### Important

Never put actual passwords, API keys, tokens, private keys, or other secrets in the README.

Use placeholders or an `.env.example` file.

---

# 12. Running the Project

Clearly explain how to start the project.

Example:

```markdown
## Running the Project

### Development

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```
```

If there are multiple services, explain how to start each one.

For example:

```text
Frontend  → http://localhost:3000
Backend   → http://localhost:4000
```

If there is a production command, document that separately.

---

# 13. Usage

Give a short explanation of what to do after the project is running.

Example:

```markdown
## Usage

1. Open the application in the browser.
2. Sign in with an authorized account.
3. Open the dashboard.
4. Select the required section.
5. Review the available information.
```

Keep this section short.

A complete user manual should live in separate documentation.

---

# 14. Project Structure

For most application repositories, include a simplified directory structure.

Example:

```markdown
## Project Structure

```text
src/
├── components/
├── pages/
├── services/
├── hooks/
├── utils/
└── main.tsx

public/
docs/
tests/
package.json
README.md
```
```

Explain the important directories:

```markdown
| Directory | Purpose |
|---|---|
| `components/` | Reusable UI components |
| `pages/` | Application pages |
| `services/` | API and external service logic |
| `hooks/` | Custom React hooks |
| `utils/` | Shared utilities |
| `tests/` | Automated tests |
| `docs/` | Detailed documentation |
```

Do not include every file in the repository just to make the tree look complete.

---

# 15. Development

Explain the basic development workflow used in the repository.

Example:

```markdown
## Development

Before submitting a change:

1. Create a feature branch.
2. Make the required changes.
3. Run the tests.
4. Run linting and formatting checks.
5. Test the application locally.
6. Push the branch.
7. Create a Pull Request.
```

If CDIS has separate Git or Pull Request standards, link to those documents instead of copying the entire standard into every README.

---

# 16. Testing

Document how developers can run the tests.

Example:

```markdown
## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```
```

If the project has different types of tests, mention them where useful:

- Unit tests
- Integration tests
- End-to-end tests

---

# 17. Code Quality

If the repository has linting, formatting, type checking, or other quality checks, document the commands.

Example:

```markdown
## Code Quality

Run linting:

```bash
npm run lint
```

Check formatting:

```bash
npm run format:check
```

Format the code:

```bash
npm run format
```
```

Only document commands that actually exist in the project.

---

# 18. Build

Explain how to create the production build.

Example:

```markdown
## Build

```bash
npm run build
```

The build output is generated in:

```text
dist/
```
```

If the project uses a different build process, document that instead.

---

# 19. Deployment

The README should explain the basic deployment approach.

Example:

```markdown
## Deployment

The application is deployed using Docker.

Build the image:

```bash
docker build -t cdis-application .
```

Run the container:

```bash
docker run -p 3000:3000 cdis-application
```

For the complete deployment process, see
[Deployment Guide](docs/deployment.md).
```

Detailed infrastructure and production procedures should normally be kept in dedicated deployment documentation.

---

# 20. Documentation

The README should make other project documentation easy to find.

Example:

```markdown
## Documentation

| Document | Description |
|---|---|
| [Architecture](docs/architecture.md) | System architecture |
| [Development Guide](docs/development.md) | Development process |
| [API Documentation](docs/api.md) | API reference |
| [Deployment Guide](docs/deployment.md) | Deployment process |
| [Security](docs/security.md) | Security requirements |
| [Troubleshooting](docs/troubleshooting.md) | Common issues |
```

The README should act as the starting point for the rest of the project's documentation.

---

# 21. Troubleshooting

Include common problems that developers are likely to encounter.

Example:

```markdown
## Troubleshooting

### Port already in use

Check which process is using port 3000:

```bash
sudo lsof -i :3000
```

Stop the process if appropriate and start the application again.
```

Do not add random troubleshooting commands that have never been relevant to the project.

---

# 22. Security

Projects should include basic security guidance where relevant.

Example:

```markdown
## Security

- Do not commit secrets or credentials.
- Do not expose internal services without authorization.
- Use environment variables or the approved secret-management system.
- Follow CDIS security standards.
- Report security vulnerabilities through the approved security process.

See [Security Documentation](docs/security.md) for more information.
```

Never include real credentials in a README.

---

# 23. Contributing

Explain how someone should contribute to the project.

Example:

```markdown
## Contributing

1. Create a feature branch.
2. Make the required changes.
3. Run tests and code-quality checks.
4. Push the branch.
5. Create a Pull Request.
6. Address review comments.
7. Merge after the required approvals and checks are complete.
```

Link to the organization's contribution or Git standards if they exist.

---

# 24. Versioning

This section is optional.

Include it when the project has a formal release/versioning process.

Example:

```markdown
## Versioning

This project follows Semantic Versioning:

MAJOR.MINOR.PATCH
```

If the project does not use a formal versioning system, this section can be left out.

---

# 25. License

Include the project's actual license.

Example:

```markdown
## License

This project is licensed under the MIT License.
See [LICENSE](LICENSE) for details.
```

For internal projects:

```markdown
## License

This is an internal CDIS project. Usage and distribution are subject
to applicable organizational policies.
```

Do not mention a license that the project does not actually use.

---

# 26. Ownership

For internal projects, it is useful to identify the responsible team.

Example:

```markdown
## Ownership

**Team:** CDIS Platform Engineering
```

This makes it easier for a new developer to know where responsibility lies.

---

# 27. Support

Provide the appropriate support channel when needed.

Example:

```markdown
## Support

For development or operational issues, contact the CDIS Platform
Engineering team through the approved internal support channel.

For security issues, follow the security reporting process described
in the Security documentation.
```

---

# 28. Markdown and Formatting Rules

README files should use consistent Markdown formatting.

### Headings

Use:

```markdown
# Project Name

## Major Section

### Subsection
```

There should normally be only one `#` heading.

Do not use bold text as a replacement for headings.

---

### Commands

Commands should always be placed inside code blocks.

Good:

```markdown
Run the development server:

```bash
npm run dev
```
```

Not:

```text
Run npm run dev to start the server.
```

The command should be easy to copy.

---

### Code

Specify the language when possible:

````markdown
```bash
npm install
```

```json
{
  "port": 3000
}
```

```typescript
const port = 3000;
```
````

---

### Links

Use meaningful link names.

Good:

```markdown
See the [Development Guide](docs/development.md).
```

Avoid:

```markdown
Click here.
```

---

# 29. Images and Diagrams

Use screenshots, diagrams, or images when they actually help explain the project.

Good examples:

- Architecture diagrams
- Important application screens
- Workflow diagrams
- Complex processes

Avoid adding images just to make the README look attractive.

For repository images:

```markdown
![Application dashboard](docs/assets/dashboard.png)
```

Keep images reasonably sized and use meaningful filenames.

---

# 30. README Anti-Patterns

The following should be avoided.

### Too much text

A README should not become a 30-page technical document.

Move detailed information into `docs/` and link to it.

### Too little information

This is not enough:

```text
# My Project

Install dependencies and run the project.
```

A developer should not have to guess the commands.

### Outdated instructions

If a command, dependency, folder, or setup process changes, update the README in the same change whenever possible.

### Secrets in the README

Never include passwords, API keys, tokens, private keys, or production credentials.

### Marketing language

Avoid phrases such as:

```text
The world's most powerful platform.
```

The README is engineering documentation. Describe what the project actually does.

### Repeating other documentation

If CDIS already has a standard for Git, security, deployment, or Pull Requests, link to that standard rather than copying the complete document into every repository.

---

# 31. Keeping the README Updated

A README is part of the project, not a document that is written once and forgotten.

Update it when changes affect:

- Installation
- Dependencies
- Environment variables
- Commands
- Project structure
- API usage
- Build process
- Deployment
- Supported versions
- Development workflow

If a code change makes the README incorrect, the README should be updated as part of the same Pull Request.

---

# 32. README Review Checklist

Before merging a new README or making a major change, check the following.

### Basic Information

- [ ] Project name is clear.
- [ ] Purpose of the project is explained.
- [ ] Project status is correct.
- [ ] Main features are listed.
- [ ] Technology stack is mentioned where useful.

### Setup

- [ ] Prerequisites are listed.
- [ ] Installation steps work.
- [ ] Configuration is explained.
- [ ] Environment variables are documented.
- [ ] No secrets are present.

### Development

- [ ] Development command is documented.
- [ ] Project structure is explained.
- [ ] Testing commands are documented.
- [ ] Code-quality commands are documented.
- [ ] Build process is documented.

### Operations

- [ ] Deployment approach is explained where applicable.
- [ ] Common problems are documented.
- [ ] Security guidance is included where required.
- [ ] Ownership/support information is available.

### Quality

- [ ] Headings follow a consistent hierarchy.
- [ ] Commands are copyable.
- [ ] Links work.
- [ ] There is no unnecessary duplication.
- [ ] Instructions match the current project.
- [ ] Spelling and grammar have been checked.

---

# 33. Standard README Template

Use the following as the starting point for a new project README.

```markdown
# <Project Name>

<Short description of what the project does and why it exists.>

## Status

<Production / Active Development / POC / etc.>

## Features

- <Feature>
- <Feature>
- <Feature>

## Technology Stack

| Area | Technology |
|---|---|
| Frontend | <Technology> |
| Backend | <Technology> |
| Database | <Technology> |
| Testing | <Technology> |
| Deployment | <Technology> |

## Architecture

<Short architecture explanation or diagram.>

See [Architecture Documentation](docs/architecture.md).

## Prerequisites

- <Requirement>
- <Requirement>
- <Requirement>

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Install dependencies

```bash
<command>
```

### 3. Configure the environment

```bash
cp .env.example .env
```

## Configuration

| Variable | Required | Description |
|---|---|---|
| `<VARIABLE>` | Yes | <Description> |
| `<VARIABLE>` | No | <Description> |

## Running the Project

### Development

```bash
<command>
```

Application:

```text
<URL>
```

## Usage

1. <Step>
2. <Step>
3. <Step>

## Project Structure

```text
<important directories>
```

## Development

1. Create a feature branch.
2. Make the changes.
3. Run tests and quality checks.
4. Create a Pull Request.

## Testing

```bash
<test-command>
```

## Code Quality

```bash
<lint-command>
```

## Build

```bash
<build-command>
```

## Deployment

<Short deployment information.>

See [Deployment Guide](docs/deployment.md).

## Documentation

- [Architecture](docs/architecture.md)
- [Development Guide](docs/development.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Security](docs/security.md)
- [Troubleshooting](docs/troubleshooting.md)

## Troubleshooting

### <Common Problem>

<How to solve it.>

## Security

<Basic security requirements and link to detailed security documentation.>

## Contributing

<Contribution process or link to the contribution guide.>

## Versioning

<Versioning information, if applicable.>

## License

<Actual license information.>

## Ownership

**Team:** <Team Name>

## Support

<Support channel or documentation link.>
```

---

# 34. CDIS Standard

For CDIS repositories, the README should be treated as the **starting point for the project**.

A developer who is new to the repository should be able to open the README and understand:

```text
What is this?
Why does it exist?
What does it do?
What technologies does it use?
How is it structured?
What do I need?
How do I install it?
How do I configure it?
How do I run it?
How do I test it?
How do I contribute?
Where is the detailed documentation?
Who owns it?
```

The README should not try to answer every technical question.

Its job is to give the engineer a clear path from:

```text
I have cloned the repository.
```

to:

```text
I understand the project and can start working on it.
```

That is the standard every CDIS repository README should follow.
