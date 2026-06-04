# react-doctor-action
[![GitHub Marketplace](https://img.shields.io/badge/GitHub-Marketplace-blue?logo=github)](https://github.com/marketplace/actions/react-doctor-action)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/icgriggs14/react-doctor-action?style=flat-square)](https://github.com/icgriggs14/react-doctor-action/stargazers)


**GitHub Action CI companion for [react-doctor](https://github.com/millionco/react-doctor)**

Automatically run `react-doctor` diagnostics on every pull request, post findings as PR comments, and optionally fail CI if issues exceed a configurable threshold.

> react-doctor: 11,928 GitHub stars • 324,593 weekly npm downloads • Created Feb 2026

## Usage

```yaml
# .github/workflows/react-doctor.yml
name: React Doctor CI

on:
  pull_request:
    branches: [main, develop]

jobs:
  react-doctor:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - uses: icgriggs14/react-doctor-action@v1
        with:
          threshold: 10
          fail_on_error: true
          paths: 'src'
```

## Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `threshold` | Fail CI if total issue count exceeds this number | `10` |
| `fail_on_error` | Fail CI if any error-level issues are found | `true` |
| `paths` | Space-separated paths or globs to check | `src` |
| `github_token` | GitHub token for posting PR comments | `${{ github.token }}` |

## Outputs

| Output | Description |
|--------|-------------|
| `issue_count` | Total number of issues found |
| `error_count` | Number of error-level issues |
| `warning_count` | Number of warning-level issues |

## PR Comment Example

The action posts a structured comment on every PR:

```
## 🟡 React Doctor — Warnings found

| Metric | Count |
|--------|-------|
| 🔴 Errors | 0 |
| 🟡 Warnings | 3 |
| 💡 Suggestions | 7 |
| Total Issues | 10 |

<details>
<summary>Issue details (10)</summary>
- warning src/components/UserCard.jsx:42: Potential XSS via dangerouslySetInnerHTML
...
</details>
```

## Use only specific paths

```yaml
- uses: icgriggs14/react-doctor-action@v1
  with:
    paths: 'src/components src/pages'
    threshold: 5
```

## Lenient mode (comment only, never fail)

```yaml
- uses: icgriggs14/react-doctor-action@v1
  with:
    threshold: 9999
    fail_on_error: false
```

## Support this project

If this Action saves you time, consider [sponsoring on GitHub Sponsors](https://github.com/sponsors/icgriggs14).

More tools by the same author:
- [claude-pr-review](https://github.com/icgriggs14/claude-pr-review) — AI-powered PR review with Claude
- [claude-changelog-action](https://github.com/icgriggs14/claude-changelog-action) — Auto-generate changelogs
- [claude-test-writer](https://github.com/icgriggs14/claude-test-writer) — Auto-generate tests on PRs

## License

MIT

## Related tools

These companion Actions from the same author work great together:

- **[knip-action](https://github.com/icgriggs14/knip-action)** — CI enforcement for knip unused-exports detection (7.97M weekly downloads)
- **[secretlint-action](https://github.com/icgriggs14/secretlint-action)** — CI credential leak detection using secretlint
- **[claude-pr-review](https://github.com/icgriggs14/claude-pr-review)** — AI-powered PR code review using Claude
- **[claude-changelog-action](https://github.com/icgriggs14/claude-changelog-action)** — Auto-generate changelogs from commits using Claude
- **[claude-test-writer](https://github.com/icgriggs14/claude-test-writer)** — AI unit test generation CLI + GitHub Action

[Sponsor this work on GitHub Sponsors](https://github.com/sponsors/icgriggs14)