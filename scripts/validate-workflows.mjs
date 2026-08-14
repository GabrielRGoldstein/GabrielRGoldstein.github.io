import { readdir, readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { parseDocument } from "yaml";

const workflowDirectory = resolve(".github/workflows");
const actionReference = /^[\w.-]+\/[\w.-]+(?:\/[\w.-]+)?@[a-f\d]{40}$/;

function collectActionUses(value, uses = []) {
  if (Array.isArray(value)) {
    for (const entry of value) collectActionUses(entry, uses);
  } else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      if (key === "uses" && typeof entry === "string") uses.push(entry);
      collectActionUses(entry, uses);
    }
  }
  return uses;
}

export async function validateWorkflows(directory = workflowDirectory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const workflowFiles = entries
    .filter((entry) => entry.isFile() && [".yml", ".yaml"].includes(extname(entry.name)))
    .map((entry) => resolve(directory, entry.name));
  const failures = [];

  if (workflowFiles.length === 0) failures.push("no workflow files found");

  for (const file of workflowFiles) {
    const source = await readFile(file, "utf8");
    const document = parseDocument(source, { prettyErrors: true, uniqueKeys: true });

    for (const error of document.errors) failures.push(`${file}: ${error.message}`);
    const workflow = document.toJS();
    if (!workflow?.jobs || Object.keys(workflow.jobs).length === 0) {
      failures.push(`${file}: workflow must define at least one job`);
    }

    for (const uses of collectActionUses(workflow)) {
      if (uses.startsWith("./") || uses.startsWith("docker://")) continue;
      if (!actionReference.test(uses)) failures.push(`${file}: action is not pinned to a 40-character SHA: ${uses}`);
    }
  }

  if (failures.length > 0) throw new Error(`Workflow validation failed:\n${failures.join("\n")}`);
  return { workflows: workflowFiles.length };
}

if (import.meta.url === new URL(`file://${resolve(process.argv[1]).replaceAll("\\", "/")}`).href) {
  validateWorkflows()
    .then(({ workflows }) => console.log(`Workflow validation passed: ${workflows} workflows.`))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
