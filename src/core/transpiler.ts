import LogReport from "@mekstuff/logreport";
import fs from "fs";
import path from "path";

import {
  ISerializedSymbol,
  JSDocTag,
  SerializedClassSymbol,
  SerializedClassSymbolMember,
} from "@mekstuff/docdocs-parser-typescript";

interface IViteConfigJSON_themeConfig_sidebarItem {
  text: string;
  items: IViteConfigJSON_themeConfig_navItem[];
  collapsed?: boolean;
}

interface IViteConfigJSON_themeConfig_navItem {
  text: string;
  link: string;
}

export interface IViteConfigJSON {
  title: string;
  description: string;
  themeConfig: {
    nav: IViteConfigJSON_themeConfig_navItem[];
    sidebar: { [key: string]: IViteConfigJSON_themeConfig_sidebarItem[] };
    socialLinks: [];
    footer?: {
      message?: string;
      copyright?: string;
    };
  };
}
/**
 * Data is read from the `.docdocs/congif.json` file
 */
export async function ReadViteConfig(
  PackageDirectory: string
): Promise<IViteConfigJSON | undefined> {
  const ConfigDir = path.join(PackageDirectory, ".docdocs", "config.json");
  if (!fs.existsSync(ConfigDir)) {
    LogReport.error(
      `The ${ConfigDir} file is missing, Rebuild without using cache to fix this problem.`
    );
  }
  try {
    const ReadConfig = JSON.parse(fs.readFileSync(ConfigDir).toString());
    return ReadConfig;
  } catch (e) {
    LogReport.error("Something went wrong when reading config file " + e);
  }
}

const CPRIGHT_B =
  "❤️ Built using <u><a target='_blank' href='https://docs.mekstuff.com/docdocs'>DocDocs</a></u> By <u><a target='_blank' href='https://mekstuff.com'>mekstuff.com</a></u> ❤️";
/**
 * Data is written to the `.docdocs/config.json` file then writes to the `.vitepress/config.ts` file with the data
 */
export async function WriteViteConfig(
  PackageDirectory: string,
  ConfigData: IViteConfigJSON
) {
  const CurrentViteConfigStr = await ReadViteConfig(PackageDirectory);
  if (JSON.stringify(CurrentViteConfigStr) === JSON.stringify(ConfigData)) {
    return; //No need to config file if data is the same (Prevents reloading)
  }
  const ConfigDir = path.join(PackageDirectory, ".docdocs", "config.json");
  if (!ConfigData.themeConfig.footer) {
    ConfigData.themeConfig.footer = {
      copyright: CPRIGHT_B,
    };
  } else {
    if (!ConfigData.themeConfig.footer.copyright) {
      ConfigData.themeConfig.footer.copyright = CPRIGHT_B;
    } else {
      if (!ConfigData.themeConfig.footer.copyright.match(CPRIGHT_B)) {
        ConfigData.themeConfig.footer.copyright += "<br>" + CPRIGHT_B;
      }
    }
  }
  const ViteConfigDir = path.join(PackageDirectory, ".vitepress", "config.ts");
  if (!fs.existsSync(ViteConfigDir)) {
    LogReport.error(
      `The ${ViteConfigDir} file is missing, Rebuild without using cache to fix this problem.`
    );
  }
  if (!fs.existsSync(ConfigDir)) {
    LogReport.error(
      `The ${ConfigDir} file is missing, Rebuild without using cache to fix this problem.`
    );
  }
  try {
    fs.writeFileSync(
      ConfigDir,
      JSON.stringify(ConfigData, undefined, 2),
      "utf8"
    );
    const viteTS_Source = `/* This file is autogenerated by docdocs
You should not change any source here as it will be overwritten

help: https://github.com/mekstuff/docdocs

Made with ❤ By MekStuff - https://mekstuff.com */
import { defineConfig } from "vitepress";
export default defineConfig(${JSON.stringify(ConfigData, undefined, 2)})
`;

    fs.writeFileSync(ViteConfigDir, viteTS_Source, "utf8");
  } catch (e) {
    LogReport.error("Something went wrong when writing config file " + e);
  }
}

/**
 * Removes the physical api/ directory, navbar /api/ and sidebar /api/
 * Must pass a read config and write the config after.
 */
export async function RemoveAPIDirectory(
  PackageDirectory: string,
  Config: IViteConfigJSON
) {
  // const Config = await ReadViteConfig(PackageDirectory);
  if (!Config) {
    return LogReport.error("No config.");
  }

  const IndexOfAPIRef = Config.themeConfig.nav.findIndex(
    (x) => x.text === "API Reference"
  );
  if (IndexOfAPIRef !== -1) {
    Config.themeConfig.nav.splice(IndexOfAPIRef, 1);
  }

  // physical api/ route on disk
  const ApiFolderDir = await GetAPIDirectoryPath(PackageDirectory);
  if (fs.existsSync(ApiFolderDir)) {
    try {
      fs.rm(ApiFolderDir, { recursive: true }, () => {
        return;
      });
    } catch (err) {
      LogReport.error(
        `Could not remove Api directory '${ApiFolderDir}' => ${err} `
      );
    }
  }
}

/**
 * Creates the API directory and nav links configuration if it doesn't exist
 */
export async function CreateAPIDirectory(PackageDirectory: string) {
  const Config = await ReadViteConfig(PackageDirectory);
  if (!Config) {
    return LogReport.error("No config.");
  }

  // physical api/ route on disk
  const ApiFolderDir = await GetAPIDirectoryPath(PackageDirectory);
  if (!fs.existsSync(ApiFolderDir)) {
    try {
      fs.mkdirSync(ApiFolderDir, { recursive: true });
    } catch (err) {
      LogReport.error(
        `Could not create Api directory '${ApiFolderDir}' => ${err} `
      );
    }
  }

  const CreateSubApiDir = (DirName: string) => {
    const TargetPath = path.join(ApiFolderDir, DirName);
    if (!fs.existsSync(TargetPath)) {
      try {
        fs.mkdirSync(TargetPath, { recursive: true });
      } catch (err) {
        LogReport.error(
          `Could not create Api sub directory '${ApiFolderDir}' => ${err} `
        );
      }
    }
  };

  // physical class/
  CreateSubApiDir("class");

  /*
  // add api/ route to navbar
  // this is added with AddAPIRoute instead so it can have a default route.
  const hasAPIReference = Config.themeConfig.nav.find(
    (e) => e.text === "API Reference" && e.link === "/api"
  );
  if (hasAPIReference === undefined) {
    Config.themeConfig.nav.push({
      text: "API Reference",
      link: "/api",
    });
  }
  */

  // add /api/ route to sidebar
  Config.themeConfig.sidebar = Config.themeConfig.sidebar || {};
  const hasAPISidebar = Config.themeConfig.sidebar["/api/"];
  if (!hasAPISidebar) {
    Config.themeConfig.sidebar["/api/"] = [];
  }
  await WriteViteConfig(PackageDirectory, Config);
}

/***/
async function GetAPIDirectoryPath(PackageDirectory: string) {
  return path.join(PackageDirectory, "api");
}

/***/
async function GetAPISubDirectoryPath(
  PackageDirectory: string,
  subDirectory: string
) {
  return path.join(await GetAPIDirectoryPath(PackageDirectory), subDirectory);
}

/**
 * Removes the route from the sidebar and deletes the markdown file.
 */
async function RemoveAPIRoute(
  PackageDirectory: string,
  RouteGroup: "Classes",
  ItemName: string
) {
  await CreateAPIDirectory(PackageDirectory);
  const ViteConfig = await ReadViteConfig(PackageDirectory);
  if (ViteConfig === undefined) {
    return LogReport.error("Something went wrong when reading viteconfig.");
  }
  const ClassesAPISidebar = ViteConfig.themeConfig.sidebar["/api/"];
  const FindIndex = ClassesAPISidebar.findIndex((x) => x.text === RouteGroup);
  if (FindIndex === -1) {
    return;
  }

  const Find = ClassesAPISidebar[FindIndex];

  const ExistsInApiSidebar = Find.items.findIndex((x) => x.text === ItemName);
  if (ExistsInApiSidebar !== -1) {
    Find.items.splice(ExistsInApiSidebar, 1);
  }

  if (Find.items.length === 0) {
    ClassesAPISidebar.splice(FindIndex);
  }

  if (ClassesAPISidebar.length === 0) {
    await RemoveAPIDirectory(PackageDirectory, ViteConfig);
  }

  const classApiFolder = await GetAPISubDirectoryPath(
    PackageDirectory,
    "class"
  );
  const MDPath = path.join(classApiFolder, ItemName + ".md");
  if (fs.existsSync(MDPath)) {
    fs.rm(MDPath, { recursive: true }, () => {
      return;
    });
  }
  await WriteViteConfig(PackageDirectory, ViteConfig);
}
/**
 * Adds the route to the sidebar.
 */
async function AddAPIRoute(
  PackageDirectory: string,
  RouteGroup: "Classes",
  Route: "class",
  ItemName: string,
  ItemMarkdown: string
) {
  await CreateAPIDirectory(PackageDirectory);
  const ViteConfig = await ReadViteConfig(PackageDirectory);
  if (ViteConfig === undefined) {
    return LogReport.error("Something went wrong when reading viteconfig.");
  }
  const ClassesAPISidebar = ViteConfig.themeConfig.sidebar["/api/"];
  const Find = ClassesAPISidebar.find((x) => x.text === RouteGroup);
  let TargetClassAPISidebar:
    | IViteConfigJSON_themeConfig_sidebarItem
    | undefined;

  if (Find !== undefined) {
    TargetClassAPISidebar = Find;
  } else {
    TargetClassAPISidebar =
      ClassesAPISidebar[
        ClassesAPISidebar.push({
          text: RouteGroup,
          items: [],
          collapsed: true,
        }) - 1
      ];
  }

  const ExistsInApiSidebar = TargetClassAPISidebar.items.find(
    (x) => x.text === ItemName
  );
  if (ExistsInApiSidebar === undefined) {
    TargetClassAPISidebar.items.push({
      text: ItemName,
      link: `/api/${Route}/` + ItemName,
    });
  }

  //adding default route
  const IndexOfAPIRef = ViteConfig.themeConfig.nav.findIndex(
    (x) => x.text === "API Reference"
  );
  const APIRefValue = {
    text: "API Reference",
    link: TargetClassAPISidebar.items[0].link,
  };
  if (IndexOfAPIRef !== -1) {
    ViteConfig.themeConfig.nav[IndexOfAPIRef] = APIRefValue;
  } else {
    ViteConfig.themeConfig.nav.push(APIRefValue);
  }

  const classApiFolder = await GetAPISubDirectoryPath(
    PackageDirectory,
    "class"
  );
  fs.writeFileSync(
    path.join(classApiFolder, ItemName + ".md"),
    ItemMarkdown,
    "utf8"
  );
  await WriteViteConfig(PackageDirectory, ViteConfig);
}

/***/
export async function RemoveAPIClass(
  PackageDirectory: string,
  ClassName: string
) {
  await RemoveAPIRoute(PackageDirectory, "Classes", ClassName);
}
/**
 * Adds the file to the API Reference directory, Creates directory and neccessary nav links if they don't exist.
 */
export async function AddAPIClass(
  PackageDirectory: string,
  Path: string,
  ClassName: string,
  ClassData: SerializedClassSymbol
) {
  //Group members first
  const Properties: SerializedClassSymbolMember[] = [];
  const Methods: SerializedClassSymbolMember[] = [];
  const Functions: SerializedClassSymbolMember[] = [];

  ClassData.members.forEach((member) => {
    switch (member.membertype) {
      case "function":
        return Functions.push(member);
      case "method":
        return Methods.push(member);
      case "property":
        return Properties.push(member);
      default:
        LogReport.error(
          "Unknown member type from class member => " + member.membertype
        );
        process.exit(1);
    }
  });

  const Markdown = `${MD.H1(ClassName)}  ${ApplyTagsToHeading(
    ClassData.class.tags
  )}

${ClassData.class.documenation}

${
  Properties.length > 0
    ? `${MD.H2("Properties")}

${Properties.map((prop, index) => {
  let MD = ClassFunctionToMD(prop, ClassData.class) + "\n";
  if (index < Properties.length - 1) {
    MD += "\n---\n\n";
  }
  return MD;
}).join("")}
`
    : ""
}

${
  Methods.length > 0
    ? `${MD.H2("Methods")}

${Methods.map((prop, index) => {
  let MD = ClassFunctionToMD(prop, ClassData.class) + "\n";
  if (index < Methods.length - 1) {
    MD += "\n---\n\n";
  }
  return MD;
}).join("")}
`
    : ""
}

${
  Functions.length > 0
    ? `${MD.H2("Functions")}

${Functions.map((prop, index) => {
  let MD = ClassFunctionToMD(prop, ClassData.class) + "\n";
  if (index < Functions.length - 1) {
    MD += "\n---\n\n";
  }
  return MD;
}).join("")}
`
    : ""
}
`;
  await AddAPIRoute(PackageDirectory, "Classes", "class", ClassName, Markdown);
}

const TAG_BADGE_COLOR_GROUPS: { [key: string]: string[] } = {
  danger: ["readonly"],
};

const IGNORE_TAGS_OF_NAME_FOR_BADGE = ["param"];

const GetTagColor = (TagName: string): string | undefined => {
  if (IGNORE_TAGS_OF_NAME_FOR_BADGE.indexOf(TagName) !== -1) {
    return;
  }
  for (const tagGroupName in TAG_BADGE_COLOR_GROUPS) {
    const tagGroup = TAG_BADGE_COLOR_GROUPS[tagGroupName];
    if (tagGroup.indexOf(TagName) !== -1) {
      return tagGroupName;
    }
  }
  return "info";
};

const GetTagBadge = (tag: JSDocTag) => {
  const TagColor = GetTagColor(tag.name);
  if (TagColor === undefined) {
    return "";
  } else {
    return `<Badge type="${GetTagColor(tag.name)}" text="${tag.name} ${
      tag.text ? `- ${tag.text}` : ""
    }" />`;
  }
};

const ApplyTagsToHeading = (Tags?: JSDocTag[]) => {
  if (Tags !== undefined) {
    return Tags.map((tag) => {
      return GetTagBadge(tag);
    }).join("");
  } else {
    return "";
  }
};

const GetCallSignatureParams = (
  ClassMember: SerializedClassSymbolMember
): string => {
  let COLUMN_HAS_DOCS_SLOT = false;
  const columns: string[] = ["Name", "Type", "Required"];
  const rows: ISerializedSymbol[] = [];
  if (
    ClassMember.callsignature &&
    ClassMember.callsignature.params.length > 0
  ) {
    ClassMember.callsignature.params.forEach((signature) => {
      //Only create documenation tab if a param has it.
      if (signature.documenation !== "" && COLUMN_HAS_DOCS_SLOT === false) {
        columns.push("Documenation");
        COLUMN_HAS_DOCS_SLOT = true;
      }
      rows.push(signature);
    });
    let t = "";
    columns.forEach((colName, index) => {
      t += `${index === 0 ? "|" : ""}${colName}|`;
    });
    t += "\n";
    columns.forEach((_, index) => {
      t += `${index === 0 ? "|" : ""}----|`;
    });
    t += "\n";

    rows.forEach((row, index) => {
      t += `${row.name}|${TypeStrToLinks(row.type)}|✓${
        row.documenation !== "" ? `|${row.documenation}` : ""
      }`;
      if (index !== rows.length) {
        t += "\n";
      }
    });
    return MD.H4("Parameters\n\n") + t;
  }
  return "";
};

const ClassFunctionToMD = (
  ClassProp: SerializedClassSymbolMember,
  Class: SerializedClassSymbol["class"]
) => {
  return `${MD.H3(ClassProp.name)} ${ApplyTagsToHeading(ClassProp.tags)} 

\`${Class.name}.${ClassProp.name}: ${ClassProp.type}\`

${ClassProp.documenation}

${GetCallSignatureParams(ClassProp)}
`;
};

const MD = {
  H1: (str: string) => {
    return "# " + str;
  },
  H2: (str: string) => {
    return "## " + str;
  },
  H3: (str: string) => {
    return "### " + str;
  },
  H4: (str: string) => {
    return "#### " + str;
  },
};

/**
 * Gets type link from string
 */
const API_DEFAULTS_LINKS: { [key: string]: string } = {
  number: "https://facebook.com",
};
const ROBLOX_ENGINE_API_URL = "https://create.roblox.com/docs/reference/engine";

const LINK_TYPE = (href: string, text: string, external?: boolean) => {
  return `<a href='${href}' ${external ? "target='_blank'" : ""}>${text}</a>`;
};

const FromTypeToLink = (Type: string): string | undefined => {
  if (API_DEFAULTS_LINKS[Type]) {
    return LINK_TYPE(API_DEFAULTS_LINKS[Type], Type, true);
  }
  return LINK_TYPE(`${ROBLOX_ENGINE_API_URL}/classes/${Type}`, Type, true);
};

/**
 * Converts types to anchor tags
 */
const TypeStrToLinks = (Type: string): string => {
  const t: { [key: string]: string } = {};
  const types = Type.split("|");
  for (let x of types) {
    x = x.replace(/\s+/g, "");
    if (!t[x]) {
      t[x] = FromTypeToLink(x) || x;
    }
  }
  for (const a in t) {
    const v = t[a];
    Type = Type.replace(a, v);
  }
  //replace | with &#124; (html code) so type doesn't cause row split. and remove exess witespace from split
  return Type.replace(/\|/g, "&#124;");
};