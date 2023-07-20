import boxen, { Options } from "boxen";

export function pbox(text: string, options?: Options) {
  return boxen(text, { ...options, padding: 0.5 });
}
