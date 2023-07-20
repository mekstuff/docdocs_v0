import chalk from "chalk";
import err from "./err.js";
import { emit } from "process";

/***/
export default function assert(
  condition: boolean,
  error: string,
  noExit?: boolean
) {
  if (!condition) {
    err(error, noExit);
  }
}
