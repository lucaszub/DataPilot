# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- SQL Explorer with CodeMirror 6 editor and TanStack Table results
- Dashboard builder with react-grid-layout (KPI, Bar, Line, Pie, Table widgets)
- Semantic model editor with ReactFlow (visual ERD, table joins)
- SavedQuery CRUD for reusable queries
- Visual WHERE filters, ORDER BY sorting, and LIMIT control in Explorer

## [0.2.0] - 2026-02-14

### Added

- CSV upload with automatic schema inference
- DuckDB-powered query execution on Parquet files
- French CSV format support (semicolon delimiter, comma decimals)
- Data source management (list, detail, preview, delete)
- API documentation for data sources and queries

### Fixed

- Broken semantic layers referencing deleted data sources

## [0.1.0] - 2026-02-13

### Added

- JWT authentication (access token 30min, refresh token 7 days)
- User registration and login
- Multi-tenant data isolation with `tenant_id` filtering
- BaseTenantService generic CRUD with tenant scoping
- Workspace management
- Frontend auth flow with shadcn/ui, React Hook Form, and Zod validation
- Split-screen auth layout
- Light mode UI theme
- Docker Compose development environment (backend, frontend, postgres, nginx)
- Production Docker Compose configuration
