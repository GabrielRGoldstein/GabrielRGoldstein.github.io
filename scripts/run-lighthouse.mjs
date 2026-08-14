import { runLighthouseGate } from "./lib/lighthouse-gate.mjs";

try {
  await runLighthouseGate();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
