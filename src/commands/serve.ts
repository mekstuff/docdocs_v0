import fs from "fs";
import chokidar from "chokidar";
import { program as CommanderProgram } from "commander";
import LogReport from "@mekstuff/logreport";
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
// import parseFile from "../core/parser.js";
import DocDocsTypescriptParser, {
  GetParserVersion,
  SerializedClassSymbol,
} from "@mekstuff/docdocs-parser-typescript";
import { AddAPIClass, RemoveAPIClass } from "../core/transpiler.js";

import glob from "glob";
import {
  BuildPages,
  UpdateConfig,
  WatchConfig,
  WatchPages,
} from "../core/pages.js";

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
    "failed to retrieve package info from root."
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
        LogReport.error(e);
      }
    }
  }
  const CacheFileExists = fs.existsSync(PackageDirectory);
  if (CacheFileExists) {
    //serve from cache.
    LogReport(
      `Found cache for "${PackageInfo!.name}" at:\n${PackageDirectory}`,
      "info",
      true
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
    "DocDocs TS Parser Version: " + chalk.green(GetParserVersion());
  assert(
    PrefPackageManager !== undefined,
    "Could not resolve package manager, this should not happen. Report bug to @mekstuff on github."
  );

  const WatchingSourceFilesLog = `Watching Source Files: ${chalk.blue(
    options.input
  )}`;

  const DevelopmentPortLog = `Development Port: ${chalk.blue(options.port)}`;

  const watcher = chokidar.watch(options.input, { ignoreInitial: true });

  type TrackFiles = { Classes: SerializedClassSymbol[] };

  //Pages
  const PagesWatcher = await WatchPages(PackageDirectory);
  const ConfigWatcher = await WatchConfig(PackageDirectory);

  const TRACK_FILES_INFO: {
    [key: string]: TrackFiles;
  } = {};

  const UnlinkFile = (filePath: string) => {
    const Tracking = TRACK_FILES_INFO[filePath];
    if (Tracking) {
      console.log("Removing ", Tracking);
    }
  };

  /**
   * changes `\` => `/`
   */
  const FilterFilePath = (filePath: string): string => {
    return filePath.replace(/\\/g, "/");
  };

  const ParseFile = async (
    TSParser: DocDocsTypescriptParser,
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
        LogReport.error(`Could not parse ${file} => ${err}`, true);
        console.error(err);
      });
    LogReport(`Transpiled ${file}...`, "info");
  };

  //yield until watcher is ready.
  await new Promise<void>((resolve) => {
    const InputFiles: string[] = [];
    watcher.on("ready", async () => {
      const files = glob.sync(options.input, { nodir: true });
      files.forEach((e) => {
        InputFiles.push(e);
      });
      const TSParser = new DocDocsTypescriptParser(InputFiles);
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

  LogReport(
    pbox(
      `${chalk.bold(
        "Starting Development Server"
      )}\n\n${DocDocsVersionLog}\n${VitePressVersionLog}\n${DocDocsTSParserVersionLog}\n\n${DevelopmentPortLog}\n${WatchingSourceFilesLog}`
    ),
    "info"
  );

  LogReport(chalk.yellow(`CTRL+C - Close development server.`), "info", true);
  process.on("SIGINT", () => {
    watcher.close();
    PagesWatcher.close();
    ConfigWatcher.close();
    process.exit();
  });

  const devExec = exec(
    `${PrefPackageManager} run docs:dev -- --strictPort --force=${options.force} --port=${options.port} --base=${options.base}`,
    {
      cwd: PackageDirectory,
    }
  );
  LogReport(
    `Visit In Browser: ${chalk.blue(`http://localhost:${options.port}\n`)}`,
    "info",
    true
  );
  devExec.stdout?.on("data", (data) => {
    // LogReport.warn(data);
  });
  devExec.on("close", (c) => {
    LogReport.warn("Server closed with exit code " + c);
  });
  devExec.on("error", (err) => {
    LogReport.error(err);
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
