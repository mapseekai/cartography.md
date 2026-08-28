# Security policy

## Reporting a vulnerability

Please report security vulnerabilities privately to the repository maintainers rather than opening a public issue. Include the affected version, impact, reproduction steps, and any suggested mitigation.

## Security boundaries

Cartography.md files are configuration and documentation, not executable programs. The reference parser intentionally rejects YAML custom tags, anchors, aliases, merge keys, and other constructs that can create inconsistent or unsafe interpretation.

The CLI does not fetch network resources while linting. Custom rules should remain deterministic and network independent.

A style visibility rule is not an authorization mechanism. Sensitive features and attributes must be removed or filtered by trusted server-side data services before delivery to an untrusted client. Do not store access tokens, credentials, private tile URLs, personal data, or secret business rules in `CARTOGRAPHY.md`, `DATA_PROFILE.json`, example styles, screenshots, or validation reports.
