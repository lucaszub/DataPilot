# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.x (current) | Yes |

## Reporting a Vulnerability

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please email **security@datapilot.dev** with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response Timeline

| Stage | Timeline |
|-------|----------|
| Acknowledgment | Within 48 hours |
| Initial assessment | Within 1 week |
| Fix and disclosure | Coordinated, typically within 90 days |

## Disclosure Policy

We follow coordinated disclosure. We ask that you:

1. Allow us reasonable time to fix the issue before public disclosure
2. Make a good-faith effort to avoid privacy violations, data destruction, or service disruption
3. Do not exploit the vulnerability beyond what is necessary to demonstrate it

## Scope

The following are in scope for security reports:

- DataPilot application code (backend + frontend)
- Docker configurations
- Authentication and authorization mechanisms
- Data isolation between tenants (multi-tenant security)
- API endpoint security

## Out of Scope

- Third-party dependencies (report to their respective maintainers)
- Issues only reproducible in development/test environments
- Social engineering attacks
- Denial of service attacks

## Recognition

We appreciate security researchers who help keep DataPilot and its users secure. With your permission, we will acknowledge your contribution in our security advisories.
