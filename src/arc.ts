import * as execa from "execa";
import * as path from "path";
import config from "./config";
import { debug } from "./debug";

// see actual type (I think) at https://github.com/phacility/arcanist/blob/master/src/lint/ArcanistLintMessage.php#L56
export interface ArcMessage {
  // start location
  line: number;
  char: number | null;
  // seems to usually be the title of the linter
  code: string;
  severity: "error" | "warning" | "autofix" | "advice" | "disabled" | string;
  // diagnostic title
  name: string | null;
  // diagnostic description
  description: string | null;
  // original text
  original: string | null;
  // replacement text
  replacement: string | null;

  // area around the text that is to be replaced
  // (I'm not entirely sure why this would be useful)
  context: string;

  // not sure what these are for
  granularity: number;
  // "other locations"
  // maybe this would be useful? https://code.visualstudio.com/api/references/vscode-api#DiagnosticRelatedInformation
  locations: undefined[];
  // arc typically ignores lines that were not edited, this bypasses that
  bypassChangedLineFiltering: boolean | null;
}
interface ArcJSON { [filename: string]: ArcMessage[] }

export async function runArcDiff(fileName: string): Promise<ArcMessage[]> {
  const bin = config.pathToArc;
  const args = ["lint", "--output", "json", fileName];
  debug(`$ ${bin} ${args.join(" ")}`);
  const { stdout } = await execa(config.pathToArc, ["lint", "--output", "json", fileName], {
    cwd: path.dirname(fileName),
  });
  const json = JSON.parse(stdout) as ArcJSON;
  const fileOutput = getArcMessageForFile(json, fileName);
  debug(fileOutput);
  return fileOutput;
}

function getArcMessageForFile(json: ArcJSON, fileName: string): ArcMessage[] {
  const fileNames = Object.keys(json);
  const key = fileNames.find((f) => fileName.endsWith(f));
  if (!key) { throw new Error(`${fileName} not found in: ${fileNames.join(", ")}`); }
  return json[key];
}
