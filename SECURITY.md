# Security Policy

## Reporting a vulnerability

Do not publish suspected vulnerabilities as public issues.

Use GitHub private vulnerability reporting when available.

Please remove personal clipboard content from logs before sharing them.

## Clipboard data

Clipdeck is local-first. Clipboard history is stored on the local machine and is not intentionally transmitted to a remote service.


## Sensitive clipboard content

Clipdeck currently records textual clipboard content locally, including
potentially sensitive text such as passwords, API keys, one-time codes or
other secrets if those values are exposed by the operating-system clipboard.

Clipboard history is not intentionally transmitted to a remote service, but
the local history is currently stored unencrypted.

Until sensitive-content exclusion is fully implemented, users should avoid
copying secrets while clipboard monitoring is active or clear the relevant
history entries afterwards.
