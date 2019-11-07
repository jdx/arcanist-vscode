import { inspect } from "util";
import { OutputChannel, window } from "vscode";
import config from "./config";

export function debug(o: any) {
  if (config.debug) {
    log(o);
  }
}
export function log(o: any) {
  if (!log._logger) {
    log._logger = window.createOutputChannel("Arcanist");
  }
  log._logger.appendLine(typeof o === "string" ? o : inspect(o));
}
log._logger = undefined as OutputChannel | undefined;
