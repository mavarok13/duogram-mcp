# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The project does not have a released version yet.

## Unreleased

### Added

- Initialized the local Git repository with a `main` branch.
- Added repository ignore and cross-platform line-ending rules.
- Added the project guidance set: `AGENTS.md`, `docs/INFO.md`,
  `docs/CHANGELOG.md`, and `docs/ROADMAP.md`.
- Added a local `codebase-index` OpenCode skill, agent, and command integration.
- Added an ignored local SQLite code index for repository retrieval.
- Excluded generated `codebase-index` integration resources from retrieval
  results.

### Removed

- Removed Qdrant and Docker Compose from the development environment in favor
  of the installed local `codebase-index` retrieval layer.
