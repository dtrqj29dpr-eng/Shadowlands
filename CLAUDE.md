# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Workflow (IMPORTANT — read at the start of every session)

This project is tracked at https://github.com/dtrqj29dpr-eng/Shadowlands.

**At the end of every working session (or after any meaningful change), commit and push:**

```bash
git add <changed files>
git commit -m "short descriptive message"
git push
```

- Write clean, descriptive commit messages (what changed and why, not how).
- Push to `origin/master` after every commit so the remote is always up to date.
- Never leave uncommitted work at the end of a session.

## Project Overview

<!-- Describe what this project is and what it does -->

## Build & Development

<!-- Commands to build, run, and develop the project -->

```bash
# Install dependencies
# e.g. npm install / pip install -r requirements.txt

# Run the project
# e.g. npm start / python main.py

# Build for production
# e.g. npm run build
```

## Testing

```bash
# Run all tests
# e.g. npm test / pytest

# Run a single test
# e.g. npm test -- path/to/test / pytest path/to/test.py::test_name
```

## Linting & Formatting

```bash
# Lint
# e.g. npm run lint / ruff check .

# Format
# e.g. npm run format / ruff format .
```

## Architecture

<!-- High-level description of the codebase structure and key modules -->
