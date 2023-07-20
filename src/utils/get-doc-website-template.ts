import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Gets the path of the `doc-website` directory on drive.
 */
export default function GetDocWebsiteTemplatePath() {
  return path.join(__dirname, "../", "../", "doc-website");
}
