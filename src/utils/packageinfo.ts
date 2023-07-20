import chalk from "chalk";
import fs from "fs";
import path from "path";
import assert from "./assert.js";
import err from "./err.js";

interface IRequiredPackageInfo {
  name: string;
  version: string;
  author?: string;
}

export function getRequiredPackageInfo(
  packageRoot?: string
): IRequiredPackageInfo | undefined {
  if (!packageRoot) {
    packageRoot = "./";
  }
  const targetDir = path.join(packageRoot, "package.json");
  const RootHas = fs.existsSync(targetDir);
  if (!RootHas) {
    err(`${chalk.red(`package.json does not exist in root "${packageRoot}"`)}`);
  }
  try {
    const d = JSON.parse(fs.readFileSync(targetDir, { encoding: "utf8" }));
    const name = d.name;
    const version = d.version;
    const author = d.author;
    assert(
      typeof name === "string",
      `package.json in root "${packageRoot}" does not contain a valid "name" field.`
    );
    assert(
      typeof version === "string",
      `package.json in root "${packageRoot}" does not contain a valid "name" field.`
    );
    return {
      name: name,
      version: version,
      author: author,
    };
  } catch (e) {
    err("Could not read package.json at root '${packageRoot}'.");
  }
}
