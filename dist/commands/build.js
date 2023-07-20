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
import path from "path";
import err from "../utils/err.js";
import chalk from "chalk";
import logwaypoint from "../utils/logwaypoint.js";
import { createTemporaryBuildCacheDirectory, getTemporaryBuildCacheDirectory, } from "../utils/homedir.js";
import { getRequiredPackageInfo } from "../utils/packageinfo.js";
import enquirer from "enquirer";
import logupdate from "../utils/logupdate.js";
import { execSync } from "child_process";
import GetDocWebsiteTemplatePath from "../utils/get-doc-website-template.js";
/**
 * Installs package deps
 */
const supportedPMs = ["yarn", "npm", "pnpm"];
/***/
export function getPackageDirectoryPackageManager(PackageDirectoryPath) {
    const HasYarn = fs.existsSync(path.join(PackageDirectoryPath, "yarn.lock"));
    if (HasYarn) {
        return "yarn";
    }
    const HasNpm = fs.existsSync(path.join(PackageDirectoryPath, "package-lock.json"));
    if (HasNpm) {
        return "npm";
    }
    const HasPnpm = fs.existsSync(path.join(PackageDirectoryPath, "pnpm-lock.yaml"));
    if (HasPnpm) {
        return "pnpm";
    }
}
/***/
function InstallPackageDirectoryDeps(PackageDirectoryPath) {
    return __awaiter(this, void 0, void 0, function* () {
        let targetPM = getPackageDirectoryPackageManager(PackageDirectoryPath);
        if (!targetPM) {
            const res = yield enquirer.prompt({
                name: "selectpm",
                type: "select",
                choices: supportedPMs,
                message: "Please select a package manager (you must have it installed)",
            });
            targetPM = res.selectpm;
        }
        const x = logwaypoint();
        const INSTALLING_DEPS_LOG = logupdate(`Installing dependencies`, true);
        const prefix = `${targetPM} install`;
        console.log(chalk.yellow(`Attempting to install dependencies with ${targetPM} using --prefer-offline flag for quicker installations.`));
        try {
            //attempt installing packages with --prefer-offline flag first.
            execSync(prefix + " --prefer-offline", {
                cwd: PackageDirectoryPath,
                stdio: "inherit",
            });
        }
        catch (e) {
            console.log(chalk.yellow(`Fresh installation of dependencies will be installed using ${targetPM}. --prefer-offline flag failed.`));
            try {
                execSync(prefix, { cwd: PackageDirectoryPath, stdio: "inherit" });
            }
            catch (e) {
                err("Could not install dependencies. " + e);
            }
        }
        console.log(`Packages were installed using ${targetPM}`);
        INSTALLING_DEPS_LOG.stop();
        logwaypoint(x, true, true);
    });
}
/**
 * Builds out base project into a temporary directory
 * @returns Temporary directory which you can rename & copy/move to needed directory
 */
export function BuildDocumentSource(packageRoot) {
    return __awaiter(this, void 0, void 0, function* () {
        const wpid = logwaypoint();
        const BUILDING_FILES_LOG = logupdate("Building documentation", true);
        packageRoot = packageRoot || "./";
        const packageInfo = getRequiredPackageInfo(packageRoot);
        createTemporaryBuildCacheDirectory();
        const uid = "docdocs-" + Math.random().toString(36).slice(2, 7) + "tmp";
        const finalpath = path.join(getTemporaryBuildCacheDirectory(), uid);
        try {
            fs.cpSync(GetDocWebsiteTemplatePath(), finalpath, { recursive: true });
        }
        catch (e) {
            err(`Could not copy website template because ${chalk.white(e)}.\nYou may remove the following directory:\n${finalpath}`);
        }
        BUILDING_FILES_LOG.stop();
        logwaypoint(wpid, true, true);
        yield InstallPackageDirectoryDeps(finalpath);
        return finalpath;
    });
}
function buildcommandaction() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("...");
    });
}
export default function buildcommand(program) {
    program
        .command("build")
        .description("Builds documentation site for publishing.")
        .action(buildcommandaction);
}
//# sourceMappingURL=build.js.map