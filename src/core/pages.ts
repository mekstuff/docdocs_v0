// import LogReport from "@mekstuff/logreport";
// import fs from "fs";
// import path from "path";
// import chokidar from "chokidar";
// import {
//   IViteConfigJSON,
//   ReadViteConfig,
//   WriteViteConfig,
// } from "./transpiler.js";

// export async function BuildDefaultHomePage(PackageDirectory: string) {
//   const HomePagePath = path.join(PackageDirectory, "index.md");
//   fs.writeFileSync(HomePagePath, HomePageDefault, "utf8");
// }

// const IGNORE_FOLDERS_BY_NAME = ["node_modules", ".docdocs", ".vitepress"];
// const IGNORE_FILES_BY_NAME = [
//   "index.md",
//   "yarn.lock",
//   "pnpm.lock",
//   "package-lock.json",
//   "package.json",
// ];

// function ClearBuldFiles(PackageDirectory: string) {
//   const DirChildren = fs.readdirSync(PackageDirectory);
//   DirChildren.forEach((child) => {
//     const isFolder = fs.statSync(path.join(PackageDirectory, child));
//     if (
//       isFolder.isDirectory() &&
//       IGNORE_FOLDERS_BY_NAME.indexOf(child) === -1
//     ) {
//       try {
//         fs.rmSync(path.join(PackageDirectory, child), { recursive: true });
//       } catch (err) {
//         LogReport.error(`Failed to remove unknown directory => ${err}`);
//       }
//     } else {
//       const extname = path.extname(child);
//       if (extname === ".md" && IGNORE_FILES_BY_NAME.indexOf(child) === -1) {
//         try {
//           fs.rmSync(path.join(PackageDirectory, child), { recursive: true });
//         } catch (err) {
//           LogReport.error(`Failed to remove old markdown file => ${err}`);
//         }
//       }
//     }
//   });
// }

// const ExtractUserConfig = (UserConfig: {
//   [key: string]: unknown;
// }): IViteConfigJSON => {
//   const Config: IViteConfigJSON = {
//     title: "",
//     description: "",
//     themeConfig: {
//       nav: [],
//       sidebar: {},
//       socialLinks: [],
//     },
//   };
//   try {
//     for (const n in Config) {
//       const v = UserConfig[n] as any;
//       if (v) {
//         if (n === "themeConfig") {
//           if (v.nav) {
//             const indexOfApi = v.nav.findIndex(
//               (x: any) => x.text === "API Reference"
//             );
//             if (indexOfApi !== -1) {
//               LogReport.warn(
//                 `"API Reference" nav link name is reserved, Link will be ignored.`
//               );
//               v.nav.splice(indexOfApi, 1);
//             }
//           }
//           if (v.sidebar && v.sidebar["/api/"]) {
//             LogReport.warn(
//               `"/api/" sidebar route name is reserved, Will be ignored.`
//             );
//             v.sidebar["/api/"] = undefined;
//           }
//         }
//         (Config as unknown as { [key: string]: unknown })[n] = v;
//       }
//     }
//   } catch (err) {
//     LogReport.error("Your config file may be broken. => " + err);
//     console.error(err);
//     process.exit(1);
//   }
//   return Config;
// };

// /**
//  * This function is probably pretty poor and needs to be updated eventually.
//  */
// const Reconcile = (Target: object, Against: { [key: string]: unknown }) => {
//   Object.keys(Target).forEach((x) => {
//     const nt = Target as { [key: string]: unknown };
//     if (typeof nt[x] === "object" && !Array.isArray(nt[x])) {
//       return Reconcile(
//         nt[x] as object,
//         Against[x] as { [key: string]: unknown }
//       );
//     } else {
//       try {
//         Against[x] = Against[x] || nt[x];
//       } catch (err) {}
//     }
//   });
// };

// export async function WatchConfig(
//   PackageDirectory: string
// ): Promise<chokidar.FSWatcher> {
//   await UpdateConfig(PackageDirectory);
//   const watcher = chokidar.watch(
//     path.join(process.cwd(), ".docdocs", "config.json"),
//     { ignoreInitial: true }
//   );
//   let lastTrigger = new Date();
//   let CanSave = true;
//   watcher.on("all", async () => {
//     const currDate = new Date();
//     if (currDate.getTime() - lastTrigger.getTime() > 200 && CanSave === true) {
//       CanSave = false;
//       await UpdateConfig(PackageDirectory);
//       CanSave = true;
//     }
//     lastTrigger = currDate;
//   });
//   return watcher;
// }

// export async function UpdateConfig(PackageDirectory: string) {
//   LogReport.Elapse("Updating Config...", "UPD CONFIG", true);

//   const ViteConfig = await ReadViteConfig(PackageDirectory);
//   if (ViteConfig === undefined) {
//     LogReport.error("ViteConfig not found.");
//     process.exit(1);
//   }

//   const ConfigPath = path.join(process.cwd(), ".docdocs", "config.json");
//   if (!fs.existsSync(ConfigPath)) {
//     LogReport.warn("No config file exists => " + ConfigPath);
//     return;
//   }
//   try {
//     let UserConfig = JSON.parse(fs.readFileSync(ConfigPath, "utf8"));
//     UserConfig = ExtractUserConfig(UserConfig);
//     await WriteViteConfig(PackageDirectory, UserConfig);
//   } catch (err) {
//     LogReport.error(
//       "Something wen't wrong when updating user config file => " + err
//     );
//     console.error(err);
//     process.exit(1);
//   }
//   LogReport.Elapse("Updated Config.", "UPD CONFIG", true);
// }

// export async function WatchPages(
//   PackageDirectory: string
// ): Promise<chokidar.FSWatcher> {
//   await BuildPages(PackageDirectory);
//   const watcher = chokidar.watch(
//     path.join(process.cwd(), ".docdocs", "pages"),
//     { ignoreInitial: true }
//   );
//   let lastTrigger = new Date();
//   let CanSave = true;
//   watcher.on("all", async () => {
//     const currDate = new Date();
//     if (currDate.getTime() - lastTrigger.getTime() > 200 && CanSave === true) {
//       CanSave = false;
//       await BuildPages(PackageDirectory);
//       CanSave = true;
//     }
//     lastTrigger = currDate;
//   });
//   return watcher;
// }

// export async function BuildPages(PackageDirectory: string) {
//   LogReport.Elapse("Building Pages...", "BUILD PAGES", true);
//   ClearBuldFiles(PackageDirectory);
//   const cwd = process.cwd();
//   //load pages from the cwd/.docdocs first and validate.
//   const UserPagesPath = path.join(cwd, ".docdocs", "pages");
//   if (!fs.existsSync(UserPagesPath)) {
//     await BuildDefaultHomePage(PackageDirectory);
//     return;
//   }

//   if (!fs.existsSync(path.join(UserPagesPath, "index.md"))) {
//     await BuildDefaultHomePage(PackageDirectory);
//   }

//   const Files: string[] = [];
//   const GetValidFiles = (Dir: string) => {
//     const DirChildren = fs.readdirSync(UserPagesPath);
//     DirChildren.forEach((child) => {
//       const childPath = path.join(Dir, child);

//       if (fs.statSync(childPath).isDirectory()) {
//         // GetValidFiles(childPath);
//       } else {
//         const ext = path.extname(childPath);
//         if (ext === ".md") {
//           Files.push(childPath);
//         }
//         // Files.push(childPath);
//       }
//     });
//   };

//   GetValidFiles(UserPagesPath);

//   Files.forEach((filePath) => {
//     const basename = path.basename(filePath);
//     if (basename === "index") {
//       return;
//     }
//     fs.cpSync(filePath, path.join(PackageDirectory, basename));
//   });
//   LogReport.Elapse("Building Pages Completed.", "BUILD PAGES", true);
// }

// const HomePageDefault = `---
// # Do not edit this file directly as it will be overwritten
// # Instead you should create a file '.docdocs/index.md'
// # Learn more:
// # https://docs.mekstuff.com/docdocs
// # https://vitepress.dev/reference/default-theme-home-page

// layout: home

// hero:
//   name: "My Awesome Project"
//   text: "A DocDocs | VitePress Site"
//   tagline: Build documenation from your source code.
//   actions:
//     - theme: brand
//       text: Learn More
//       link: https://docs.mekstuff.com/docdocs/
//     - theme: alt
//       text: Build custom landing page
//       link: https://docs.mekstuff.com/docdocs/custom-pages

// features:
//   - title: Open Source
//     icon: ❤️
//     link: https://github.com/mekstuff/docdocs
//     linkText: Github
//     details: DocDocs is an open source project maintained by the mekstuff developers & open source community ❤️
//   - title: Lightning Fast
//     icon: ⚡
//     details: DocDocs uses vitepress to build your documenation which is built ontop of the lightning fast vite framework.
//     link: https://vitepress.dev
//     linkText: Learn More
//   - title: Become a Sponsor
//     icon: 😊
//     details: Becoming a sponsor of this project does not only help support it, but unlocks features to help build even better documenation.
//     link: https://github.com/mekstuff/docdocs/sponsor
//     linkText: View Benefits
// ---

// <br/>

// <script setup>
// import { VPTeamMembers } from 'vitepress/theme'

// const members = [
//   {
//     avatar: 'https://www.github.com/mekstuff.png',
//     name: 'Mekstuff',
//     title: 'Creators of DocDocs',
//     links: [
//       { icon: 'github', link: 'https://github.com/mekstuff' },
//       { icon: 'twitter', link: 'https://twitter.com/mekstuff' },
//       { icon: 'instagram', link: 'https://instagram.com/mek.stuff' }
//     ]
//   },
//   {
//     avatar: 'https://www.github.com/yyx990803.png',
//     name: 'Evan You',
//     title: 'Creator of VitePress',
//     links: [
//       { icon: 'github', link: 'https://github.com/yyx990803' },
//       { icon: 'twitter', link: 'https://twitter.com/youyuxi' }
//     ]
//   },

// ]
// </script>

// <VPTeamMembers size="small" :members="members" />
// `;
