import { spawnSync } from "node:child_process";
import fs from "node:fs";

function parseArgs(argv) {
  return argv.reduce((acc, arg) => {
    const [key, value] = arg.replace(/^--/, "").split("=");
    if (key === "iterations") acc.iterations = Number(value);
    if (key === "until") acc.until = value;
    return acc;
  }, { iterations: 1, until: null });
}

function getUntilDate(value) {
  if (!value) return null;
  const match = String(value).match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new Error(`Formato invalido para --until: ${value}. Use HH:MM.`);
  }

  const now = new Date();
  const target = new Date(now);
  target.setHours(Number(match[1]), Number(match[2]), 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

const args = parseArgs(process.argv.slice(2));
const maxIterations = Number.isFinite(args.iterations) && args.iterations > 0
  ? Math.floor(args.iterations)
  : Number.POSITIVE_INFINITY;
const untilDate = getUntilDate(args.until);
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const report = {
  startedAt: new Date().toISOString(),
  command: "npm run test:validation",
  requestedIterations: Number.isFinite(maxIterations) ? maxIterations : "until",
  until: untilDate ? untilDate.toISOString() : null,
  iterations: [],
  status: "RUNNING"
};

function writeReport() {
  fs.writeFileSync("VALIDATION_LOOP_REPORT.json", `${JSON.stringify(report, null, 2)}\n`);
}

writeReport();

for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
  if (untilDate && new Date() >= untilDate) {
    report.status = "STOPPED_BY_TIME_LIMIT";
    break;
  }

  const startedAt = new Date();
  console.log(`[validation-loop] Iteracao ${iteration} iniciada em ${startedAt.toLocaleString("pt-BR")}`);

  const result = spawnSync(npmCommand, ["run", "test:validation"], {
    encoding: "utf8",
    stdio: "pipe"
  });

  const finishedAt = new Date();
  const item = {
    iteration,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    status: result.status === 0 ? "PASSED" : "FAILED",
    exitCode: result.status
  };
  if (result.status !== 0) {
    item.stdout = result.stdout;
    item.stderr = result.stderr;
  }
  report.iterations.push(item);
  writeReport();

  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    report.status = "FAILED";
    report.failedAtIteration = iteration;
    report.finishedAt = new Date().toISOString();
    writeReport();
    console.error(`[validation-loop] Falha na iteracao ${iteration}. Execucao interrompida.`);
    process.exit(result.status || 1);
  }

  console.log(`[validation-loop] Iteracao ${iteration} aprovada em ${((finishedAt - startedAt) / 1000).toFixed(1)}s.`);
}

if (report.status === "RUNNING") {
  report.status = "PASSED";
}
report.finishedAt = new Date().toISOString();
writeReport();

console.log(`[validation-loop] Finalizado com status ${report.status}. Iteracoes executadas: ${report.iterations.length}.`);
