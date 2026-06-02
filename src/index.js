const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');

async function run() {
  try {
    const threshold = parseInt(core.getInput('threshold') || '10', 10);
    const failOnError = core.getInput('fail_on_error') !== 'false';
    const paths = core.getInput('paths') || 'src';
    const token = core.getInput('github_token');

    core.info(`Running react-doctor on: ${paths}`);
    core.info(`Threshold: ${threshold}, fail_on_error: ${failOnError}`);

    let stdout = '';
    let stderr = '';

    const exitCode = await exec.exec(
      'npx',
      ['--yes', 'react-doctor', '--format', 'json', ...paths.split(/\s+/).filter(Boolean)],
      {
        ignoreReturnCode: true,
        listeners: {
          stdout: (data) => { stdout += data.toString(); },
          stderr: (data) => { stderr += data.toString(); },
        },
      }
    );

    let issues = [];
    let errorCount = 0;
    let warningCount = 0;
    let suggestionCount = 0;
    let parseError = null;

    // Try JSON parse first, fall back to text parsing
    try {
      const parsed = JSON.parse(stdout);
      if (Array.isArray(parsed)) {
        issues = parsed;
      } else if (parsed && Array.isArray(parsed.issues)) {
        issues = parsed.issues;
      } else if (parsed && Array.isArray(parsed.results)) {
        issues = parsed.results.flatMap((r) => r.issues || []);
      }
      errorCount = issues.filter((i) => i.severity === 'error' || i.level === 'error').length;
      warningCount = issues.filter((i) => i.severity === 'warning' || i.level === 'warning').length;
      suggestionCount = issues.filter(
        (i) => i.severity === 'suggestion' || i.severity === 'info' || i.level === 'suggestion'
      ).length;
    } catch {
      parseError = 'Could not parse JSON output — falling back to text analysis';
      // Text-based fallback
      const lines = (stdout + stderr).split('\n');
      errorCount = lines.filter((l) => /\berror\b/i.test(l)).length;
      warningCount = lines.filter((l) => /\bwarn(ing)?\b/i.test(l)).length;
      suggestionCount = lines.filter((l) => /\bsuggestion\b/i.test(l)).length;
      issues = lines
        .filter((l) => l.trim())
        .map((l) => ({ message: l, severity: /error/i.test(l) ? 'error' : /warn/i.test(l) ? 'warning' : 'suggestion' }));
    }

    const totalIssues = issues.length || errorCount + warningCount + suggestionCount;
    core.setOutput('issue_count', String(totalIssues));
    core.setOutput('error_count', String(errorCount));
    core.setOutput('warning_count', String(warningCount));

    // Post PR comment if we're in a pull_request context
    const ctx = github.context;
    if (token && ctx.payload.pull_request) {
      const octokit = github.getOctokit(token);
      const prNumber = ctx.payload.pull_request.number;
      const { owner, repo } = ctx.repo;

      const statusEmoji = errorCount > 0 ? '🔴' : warningCount > 0 ? '🟡' : '🟢';
      const statusLabel = errorCount > 0 ? 'Errors found' : warningCount > 0 ? 'Warnings found' : 'All clear';

      let body = `## ${statusEmoji} React Doctor — ${statusLabel}\n\n`;
      body += `| Metric | Count |\n|--------|-------|\n`;
      body += `| 🔴 Errors | ${errorCount} |\n`;
      body += `| 🟡 Warnings | ${warningCount} |\n`;
      body += `| 💡 Suggestions | ${suggestionCount} |\n`;
      body += `| **Total Issues** | **${totalIssues}** |\n\n`;

      if (parseError) {
        body += `> ⚠️ ${parseError}\n\n`;
      }

      if (issues.length > 0 && issues.length <= 20) {
        body += `<details><summary>Issue details (${issues.length})</summary>\n\n`;
        for (const issue of issues.slice(0, 20)) {
          const sev = issue.severity || issue.level || 'info';
          const msg = issue.message || issue.description || JSON.stringify(issue);
          const file = issue.file || issue.path || '';
          const line = issue.line ? `:${issue.line}` : '';
          body += `- **${sev}** ${file}${line}: ${msg}\n`;
        }
        body += `\n</details>\n\n`;
      } else if (issues.length > 20) {
        body += `_${issues.length} issues found — showing first 20 above. Run react-doctor locally for the full report._\n\n`;
      }

      body += `<sub>Powered by [react-doctor-action](https://github.com/icgriggs14/react-doctor-action) • `;
      body += `Paths: \`${paths}\` • Threshold: ${threshold}</sub>`;

      await octokit.rest.issues.createComment({ owner, repo, issue_number: prNumber, body });
      core.info('Posted PR comment with react-doctor findings.');
    } else {
      core.info('Not a PR context or no token — skipping PR comment.');
    }

    // Determine failure
    const thresholdExceeded = totalIssues > threshold;
    const errorGate = failOnError && errorCount > 0;

    if (errorGate) {
      core.setFailed(`react-doctor found ${errorCount} error(s) — fail_on_error=true`);
    } else if (thresholdExceeded) {
      core.setFailed(`react-doctor found ${totalIssues} issues, exceeding threshold of ${threshold}`);
    } else {
      core.info(`react-doctor passed: ${totalIssues} issue(s) within threshold (${threshold})`);
    }
  } catch (error) {
    core.setFailed(`react-doctor-action failed: ${error.message}`);
  }
}

run();
