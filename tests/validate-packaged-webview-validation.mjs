import assert from "node:assert/strict";
import fs from "node:fs";

const recordPath =
  "docs/operator-notes/validation/" +
  "packaged-webview-validation.json";

assert.ok(
  fs.existsSync(recordPath),
  `Missing validation record: ${recordPath}`
);

const record = JSON.parse(
  fs.readFileSync(recordPath, "utf8")
);

assert.equal(record.schema_version, "0.1.0");
assert.equal(
  record.kind,
  "veil.packaged_webview_validation"
);
assert.match(record.source_commit, /^[0-9a-f]{7,40}$/);
assert.ok(
  !Number.isNaN(Date.parse(record.validated_at)),
  "validated_at must be a valid timestamp."
);
assert.equal(record.platform, "macOS");
assert.equal(
  record.surface,
  "packaged Tauri desktop application"
);
assert.equal(record.validated_by, "human_operator");

const requiredChecks = [
  "packaged_app_launches",
  "adult_gate_renders",
  "browser_surface_renders",
  "webview_navigation_visible",
  "https_navigation_renders",
  "http_navigation_blocked",
  "sandbox_badge_active",
  "downloads_badge_blocked",
  "policy_reason_visible",
  "decision_log_records_allowed_navigation",
  "decision_log_records_blocked_navigation",
  "no_crash_or_blank_webview"
];

assert.equal(typeof record.checks, "object");

assert.deepEqual(
  Object.keys(record.checks).sort(),
  [...requiredChecks].sort(),
  "Validation checks do not match the contract."
);

for (const check of requiredChecks) {
  assert.equal(
    record.checks[check],
    true,
    `Required check failed: ${check}`
  );
}

assert.ok(Array.isArray(record.findings));

for (const [index, finding] of record.findings.entries()) {
  assert.equal(
    finding.severity,
    "non_blocking",
    `Passing record finding ${index} must be non_blocking.`
  );

  for (const field of [
    "area",
    "finding",
    "recommended_change"
  ]) {
    assert.ok(
      typeof finding[field] === "string" &&
        finding[field].trim(),
      `findings[${index}].${field} is required.`
    );
  }
}

assert.equal(record.decision, "pass");
assert.ok(
  typeof record.decision_reason === "string" &&
    record.decision_reason.trim(),
  "decision_reason is required."
);

console.log(
  JSON.stringify(
    {
      status: "pass",
      sourceCommit: record.source_commit,
      passedChecks: requiredChecks.length,
      findingCount: record.findings.length,
      decision: record.decision
    },
    null,
    2
  )
);

console.log(
  "PASS: packaged WebView validation is canonical."
);
