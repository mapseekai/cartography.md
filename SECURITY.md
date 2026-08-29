# Security policy

## Reporting a vulnerability

Report security vulnerabilities privately to the repository maintainers rather than opening a public issue. Include the affected version, impact, reproduction steps, and any suggested mitigation.

## Treat every document as untrusted input

`CARTOGRAPHY.md` contains YAML and Markdown supplied by people, agents, repositories, or downloaded packages. Read it as data, never as executable code or trusted instructions.

The reference parser rejects YAML custom tags, anchors, aliases, merge keys, duplicate keys, tab indentation, non-finite numbers, and ambiguous constructs that can produce unsafe or inconsistent interpretation. Core linting does not fetch network resources. Custom document rules must remain deterministic, side-effect free, and network independent.

The built-in `maxDocumentBytes` check is advisory and runs only after the complete input has been read and parsed; callers must enforce byte or stream limits before passing untrusted input to `lint`, `lintFile`, or standard input.

Consumers that display Markdown should use a safe parser, escape or sanitize generated HTML, and keep script execution disabled. File paths, links, extension values, and unknown keys must not be treated as authority to read local files, contact a service, or execute a command.

## No secrets in `CARTOGRAPHY.md`

Never put access tokens, passwords, credentials, private URLs, personal data, encryption material, confidential identifiers, or secret business rules in `CARTOGRAPHY.md`.

The document is designed to be portable, shareable, committed to version control, included in packages, and supplied to agents. Namespaced extensions do not create a secure storage area. Use an appropriate secret manager and pass sensitive runtime values only to the trusted system that needs them.

## Validation boundary

A passing lint report establishes only document structure and deterministic internal validity. It does not authorize data access, establish that external content is safe, or verify a produced artifact. Runtime systems remain responsible for permission checks, data minimization, output sanitization, and review of any external resources they choose to use.
