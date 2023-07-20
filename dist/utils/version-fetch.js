import fs from "fs";
import path from "path";
import chalk from "chalk";
import assert from "./assert.js";
/**
 * @param FetchLatest Will grab the latest version of VitePress and compare.
 */
export function GetPackageVitePressVersion(PackageRoot, FetchLatest) {
    assert(typeof PackageRoot === "string", `PackageRoot expected to be string, got ${PackageRoot}`);
    const Prefix = "VitePress version: ";
    const PackageJSONPath = path.join(PackageRoot, "package.json");
    if (fs.existsSync(PackageJSONPath)) {
        try {
            const d = JSON.parse(fs.readFileSync(PackageJSONPath, "utf8"));
            if (d && d.dependencies && d.dependencies.vitepress) {
                return Prefix + chalk.green(d.dependencies.vitepress);
            }
            else {
                return Prefix + chalk.red("NODATA");
            }
            //   return chalk.green(d.dependencies?.VitePress || "NoDATA");
        }
        catch (e) {
            console.warn(chalk.yellow(`Something went wrong when getting vitepress version from ${PackageJSONPath}. => ${e}`));
        }
    }
    return Prefix + chalk.red("Unknown");
}
/**
 * Gets the current version of DocDocs that's being used
 */
export function GetCurrentDocDocsVersion(FetchLatest) {
    const Prefix = "DocDocs Version: ";
    return Prefix + chalk.green("0.1.1");
}
//# sourceMappingURL=version-fetch.js.map