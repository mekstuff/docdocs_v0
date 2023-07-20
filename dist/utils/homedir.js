var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
export function createHomeDir() {
    return __awaiter(this, void 0, void 0, function* () {
        if (fs.existsSync(docdocshomedir)) {
            return;
        }
        yield fs.promises.mkdir(docdocshomedir).catch((error) => {
            err(pbox(chalk.red(`Could not create home directory path '${docdocshomedir}'. => ${err}`)));
        });
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
export function createBuildCacheDirectory() {
    return __awaiter(this, void 0, void 0, function* () {
        yield createHomeDir();
        if (!fs.existsSync(BuildCacheDirectory)) {
            try {
                fs.mkdirSync(BuildCacheDirectory);
            }
            catch (e) {
                err(e);
            }
        }
    });
}
/***/
export function getBuildCacheDirectory() {
    return BuildCacheDirectory;
}
const TemporaryBuildDirectoryPath = path.join(getHomeDir(), "temp-build");
/**
 * Creates the cache build directory in `.docdocs/cache`
 */
export function createTemporaryBuildCacheDirectory() {
    return __awaiter(this, void 0, void 0, function* () {
        yield createHomeDir();
        if (!fs.existsSync(TemporaryBuildDirectoryPath)) {
            try {
                fs.mkdirSync(TemporaryBuildDirectoryPath);
            }
            catch (e) {
                err(e);
            }
        }
    });
}
/***/
export function getTemporaryBuildCacheDirectory() {
    return TemporaryBuildDirectoryPath;
}
//# sourceMappingURL=homedir.js.map