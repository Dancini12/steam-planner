import { spawnSync } from "node:child_process";

const files = [
  "src/lib/exportReport.js",
  "src/lib/learningExperience.js",
  "tests/financial-export.spec.js",
  "tests/global-validation.spec.js",
  "tests/deterministic-validation.spec.js",
  "tests/fixtures/steamActivities.js",
  "scripts/lint-syntax.js",
  "scripts/run-validation-loop.js"
];

let failed = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
    stdio: "pipe"
  });

  if (result.status !== 0) {
    failed = true;
    process.stderr.write(`\n[lint] Falha de sintaxe em ${file}\n`);
    if (result.stdout) process.stderr.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }
}

if (failed) {
  process.exit(1);
}

console.log(`[lint] ${files.length} arquivos de validacao conferidos com sucesso.`);
