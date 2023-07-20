import chalk from "chalk";
/**
 * Errors to the console.
 * @param noExit Set whether or not exit process.
 */
export default function err(error, noExit) {
    console.error(chalk.red(error));
    if (!noExit) {
        process.exit(1);
    }
}
//# sourceMappingURL=err.js.map