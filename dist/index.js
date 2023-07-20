#!/usr/bin/env node
/* Made with ❤ By MekStuff */
import { Command } from "commander";
const program = new Command();
import buildcommand from "./commands/build.js";
buildcommand(program);
import servecommand from "./commands/serve.js";
servecommand(program);
program.parse();
//# sourceMappingURL=index.js.map