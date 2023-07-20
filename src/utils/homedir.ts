import fs from "fs";
import os from "os";
import path from "path";
import { pbox } from "./boxen.js";
import chalk from "chalk";
import err from "./err.js";

const homedir = os.homedir();

const docdocshomedir = path.join(homedir, ".docdocs");

/**
 * Creates the `.docdocs` directory in user | home
 */
export async function createHomeDir(): Promise<undefined> {
  if (fs.existsSync(docdocshomedir)) {
    return;
  }
  await fs.promises.mkdir(docdocshomedir).catch((error) => {
    err(
      pbox(
        chalk.red(
          `Could not create home directory path '${docdocshomedir}'. => ${err}`
        )
      )
    );
  });
}

/***/
export function getHomeDir() {
  return docdocshomedir;
}

const BuildCacheDirectory = path.join(getHomeDir(), "build");
/**
 * Creates the cache build directory in `.docdocs/cache`
 */
export async function createBuildCacheDirectory() {
  await createHomeDir();
  if (!fs.existsSync(BuildCacheDirectory)) {
    try {
      fs.mkdirSync(BuildCacheDirectory);
    } catch (e) {
      err(e);
    }
  }
}

/***/
export function getBuildCacheDirectory() {
  return BuildCacheDirectory;
}

const TemporaryBuildDirectoryPath = path.join(getHomeDir(), "temp-build");
/**
 * Creates the cache build directory in `.docdocs/cache`
 */
export async function createTemporaryBuildCacheDirectory() {
  await createHomeDir();
  if (!fs.existsSync(TemporaryBuildDirectoryPath)) {
    try {
      fs.mkdirSync(TemporaryBuildDirectoryPath);
    } catch (e) {
      err(e);
    }
  }
}

/***/
export function getTemporaryBuildCacheDirectory() {
  return TemporaryBuildDirectoryPath;
}
