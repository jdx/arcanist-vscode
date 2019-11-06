import { commands, ExtensionContext, languages, workspace } from "vscode";
import { createArcDiff, runArcDiff, updateArcDiff } from "./arc";
import ArcCodeActionsProvider from "./code_provider";
import config from "./config";
import ArcFormattingEditProvider from "./edit_provider";

export function activate(context: ExtensionContext) {
  const userConfig = workspace.getConfiguration("arcanist");
  config.debug = userConfig.get("debug") || config.debug;
  config.pathToArc = userConfig.get("arcanist.pathToArc") || config.pathToArc;
  ArcFormattingEditProvider.diags = languages.createDiagnosticCollection("Arcanist");
  context.subscriptions.push(
    ArcFormattingEditProvider.diags,
    languages.registerDocumentFormattingEditProvider({ scheme: "file" }, new ArcFormattingEditProvider()),
    languages.registerCodeActionsProvider({ scheme: "file" }, new ArcCodeActionsProvider()),
  );

  context.subscriptions.push(
    commands.registerCommand("arc.diff", runArcDiff),
    commands.registerCommand("arc.diff.create", createArcDiff),
    commands.registerCommand("arc.diff.update", updateArcDiff),
  );
}
