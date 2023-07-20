// import {
// ParseSourceFile,
// ToMarkDown,
// } from "@mekstuff/docdocs-parser-typescript";

import LogReport from "@mekstuff/logreport";

/**
 * Creates MD from given source file
const parseFile = (sourceFile: string) => {
  return ToMarkDown(ParseSourceFile(sourceFile));
};
*/

/**
 * Wrapse the call into a promise
parseFile.promise = async (sourceFile: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      resolve(parseFile(sourceFile));
    } catch (e) {
      LogReport.error(`Parsing Error on ${sourceFile} => ${e}  `);
      // console.error(chalk.red(`Parsing Error on ${sourceFile} => ${e}`));
      reject(e);
    }
  });
};

export default parseFile;
*/
