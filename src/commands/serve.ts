import fs from "fs";
import chokidar from "chokidar";
import { program as CommanderProgram } from "commander";
import { Console } from "@mekstuff/logreport";
import {
  BuildDocumentSource,
  getPackageDirectoryPackageManager,
} from "./build.js";
import assert from "../utils/assert.js";
import { pbox } from "../utils/boxen.js";
import chalk from "chalk";
import { exec } from "child_process";
import {
  createBuildCacheDirectory,
  getBuildCacheDirectory,
} from "../utils/homedir.js";
import { getRequiredPackageInfo } from "../utils/packageinfo.js";
import path from "path";
import err from "../utils/err.js";
import {
  GetCurrentDocDocsVersion,
  GetPackageVitePressVersion,
} from "../utils/version-fetch.js";

import {
  ClassNode,
  DocDocsParserTypescript,
  GetParserVersion,
  ISerializedClassNode,
} from "@mekstuff/docdocs-parser-typescript";
// import { AddAPIClass, RemoveAPIClass } from "../core/transpiler.js";
import glob from "glob";
import {
  AddAPIClass,
  ReadViteConfig,
  RemoveAPIDirectory,
  WriteApiFiles,
} from "../core/transpiler.js";
// import { WatchConfig, WatchPages } from "../core/pages.js";

interface Iservecommandactionoptions {
  port: string;
  input: string;
  base: string;
  force?: boolean;
}

async function servecommandaction(options: Iservecommandactionoptions) {
  const PackageInfo = getRequiredPackageInfo();
  assert(
    PackageInfo !== undefined,
    "failed to retrieve package info from roots."
  );
  await createBuildCacheDirectory();

  const PackageDirectory = path.join(
    getBuildCacheDirectory(),
    PackageInfo!.name
  );
  if (options.force) {
    try {
      fs.rmSync(PackageDirectory, { recursive: true, force: true });
    } catch (e) {
      //means directory existed but cannot remove.
      if ((e as { code: string }).code !== "ENOTEMPTY") {
        Console.error(e);
      }
    }
  }
  const CacheFileExists = fs.existsSync(PackageDirectory);
  if (CacheFileExists) {
    //serve from cache.
    Console.info(
      `Found cache for "${PackageInfo!.name}" at:\n${PackageDirectory}`
    );
  } else {
    //build new and add to cache
    //TODO: scoped directories fail to work since the @scope directory may not exist.
    const TempOutputDirectory = await BuildDocumentSource();
    try {
      fs.renameSync(TempOutputDirectory, PackageDirectory);
    } catch (e) {
      err(
        `${e}\n\nFailed to get rename temporary build to cache, You may ${chalk.green(
          `run serve again to regen new build`
        )} OR manually move the following directories:\n\n${TempOutputDirectory}\nTO\n${PackageDirectory}\n\n then run serve again.`
      );
    }
  }

  const PrefPackageManager =
    getPackageDirectoryPackageManager(PackageDirectory);

  assert(
    typeof options.port === "string",
    `unsupported port type. ${typeof options.port}`
  );
  assert(
    typeof options.input === "string",
    `unsupported input type. ${typeof options.input}`
  );

  const DocDocsVersionLog = GetCurrentDocDocsVersion();
  const VitePressVersionLog = GetPackageVitePressVersion(PackageDirectory);
  const DocDocsTSParserVersionLog =
    "DocDocs TS Parser Version: " + chalk.green(await GetParserVersion());
  assert(
    PrefPackageManager !== undefined,
    "Could not resolve package manager, this should not happen. Report bugs to @mekstuff on github."
  );

  const WatchingSourceFilesLog = `Watching Source Files: ${chalk.blue(
    options.input
  )}`;

  const DevelopmentPortLog = `Development Port: ${chalk.blue(options.port)}`;

  const watcher = chokidar.watch(options.input, { ignoreInitial: true });

  type TrackFiles = { Classes: ClassNode[] };

  //Pages
  // const PagesWatcher = await WatchPages(PackageDirectory);
  // const ConfigWatcher = await WatchConfig(PackageDirectory);

  const TRACK_FILES_INFO: {
    [key: string]: TrackFiles;
  } = {};

  const UnlinkFile = (filePath: string) => {
    const Tracking = TRACK_FILES_INFO[filePath];
    if (Tracking) {
      console.log("Removing ", Tracking);
    }
  };

  /*
  const ParseFile = async (
    TSParser: DocDocsParserTypescript,
    file: string,
    reset?: boolean
  ) => {
    file = FilterFilePath(file);
    LogReport(`Transpiling ${file}...`, "info");
    await TSParser.parse(file, reset)
      .then(async (res) => {
        const newTracking: TrackFiles = {
          Classes: [],
        };
        for (const ClassName in res.Classes) {
          const TargetClass = res.Classes[ClassName];
          newTracking.Classes.push(TargetClass);
          await AddAPIClass(PackageDirectory, file, ClassName, TargetClass);
        }

        if (TRACK_FILES_INFO[file] !== undefined) {
          TRACK_FILES_INFO[file].Classes.forEach(async (oldClassInfo) => {
            //remove any old classes.
            if (
              newTracking.Classes.find(
                (x) => x.class.name === oldClassInfo.class.name
              ) === undefined
            ) {
              await RemoveAPIClass(PackageDirectory, oldClassInfo.class.name);
            }
          });
        }

        TRACK_FILES_INFO[file] = newTracking;
      })
      .catch((err) => {
        Console.error(`Could not parse ${file} => ${err}`, true);
        console.error(err);
      });
    LogReport(`Transpiled ${file}...`, "info");
  };
  */

  Console.LOG(
    pbox(
      `${chalk.bold(
        "Starting Development Server"
      )}\n\n${DocDocsVersionLog}\n${VitePressVersionLog}\n${DocDocsTSParserVersionLog}\n\n${DevelopmentPortLog}\n${WatchingSourceFilesLog}`
    )
  );
  Console.info(
    `Visit In Browser: ${chalk.blue(`http://localhost:${options.port}\n`)}`
  );
  Console.info(chalk.yellow(`CTRL+C - Close development server.`));
  const TranspilerLogger = Console.Log(chalk.redBright("Transpiler: "), "");
  const ApiClassEntries: Map<string, ISerializedClassNode[]> = new Map();
  const ParseFile = async (
    TSParser: DocDocsParserTypescript,
    file: string,
    reset?: boolean
  ) => {
    TranspilerLogger(`Transpiling ${file}...  `);
    TSParser.parse(file, reset)
      .then(async (res) => {
        const exists = ApiClassEntries.get(file);
        if (exists === undefined) {
          ApiClassEntries.set(file, []);
        } else {
          ApiClassEntries.set(
            file,
            exists.filter((x) =>
              res.Classes.find((q) => {
                if (q.symbol.name === x.symbol.name) {
                  return false;
                }
              })
            )
          );
        }
        for (const Class of res.Classes) {
          const m = ApiClassEntries.get(file);
          if (m !== undefined) {
            m.push(Class);
          }
        }
        // const vc = await ReadViteConfig(PackageDirectory);
        // if (vc === undefined) {
        //   Console.error(`No vite config found. Failed Transpiling`);
        //   process.exit(1);
        // }
        WriteApiFiles(PackageDirectory, ApiClassEntries);

        // }
        // ApiClassEntries.get(file)?.forEach((x) => {
        //   console.log(res.Classes.indexOf(x), x.symbol.name);
        // });
        TranspilerLogger(`Transpiled ${file} ✅`);
      })
      .catch((err) => {
        Console.error(`Failed to transpile ${file}. ${err}`, true);
        TranspilerLogger("");
        // TranspilerSpinner.stop();
        // TranspilerSpinner.text("");
      });
  };
  //yield until watcher is ready.
  await new Promise<void>((resolve) => {
    const InputFiles: string[] = [];
    watcher.on("ready", async () => {
      const files = glob.sync(options.input, { nodir: true });
      files.forEach((e) => {
        InputFiles.push(e);
      });
      const TSParser = new DocDocsParserTypescript(InputFiles);
      //initialize api classes.
      InputFiles.forEach(async (f) => {
        await ParseFile(TSParser, f);
      });
      watcher.on("change", async (filePath) => {
        // await BuildPages(PackageDirectory); //this would be on it's on pages/ watcher

        await ParseFile(TSParser, filePath, true);
      });
      watcher.on("add", async (filePath) => {
        await ParseFile(TSParser, filePath, true);
      });
      watcher.on("unlink", (filePath) => {
        UnlinkFile(filePath);
      });
      resolve();
    });
  });
  process.on("SIGINT", () => {
    watcher.close();
    // PagesWatcher.close();
    // ConfigWatcher.close();
    process.exit();
  });

  const devExec = exec(
    `${PrefPackageManager} run docs:dev -- --strictPort --force=${options.force} --port=${options.port} --base=${options.base}`,
    {
      cwd: PackageDirectory,
    }
  );

  devExec.stdout?.on("data", (data) => {
    // LogReport.warn(data);
  });
  devExec.on("close", (c) => {
    Console.warn("Server closed with exit code " + c);
  });
  devExec.on("error", (err) => {
    Console.error(err);
  });
}

export default function servecommand(program: typeof CommanderProgram) {
  program
    .command("serve")
    .option(
      "-p, --port [string]",
      "The port to start development server on.",
      "4380"
    )
    .option("-b, --base [string]", "Public base path.", "/")
    .option(
      "-i, --input [string]",
      "input directory of source files.",
      "src/*.ts"
    )
    .option(
      "-f, --force",
      "Force the optimizer to ignore the cache and re-bundle."
    )
    .description("serves documentation site for testing.")
    .action(servecommandaction);
}
