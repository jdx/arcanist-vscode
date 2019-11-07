import { inspect } from "util";
import {
  CancellationToken,
  CodeAction,
  CodeActionContext,
  CodeActionProvider,
  Range,
  Selection,
  TextDocument,
  WorkspaceEdit,
} from "vscode";
import { debug } from "./debug";
import Message from "./message";

export default class ArcCodeActionsProvider implements CodeActionProvider {
  public provideCodeActions(
    document: TextDocument,
    range: Range | Selection,
    context: CodeActionContext,
    token: CancellationToken,
  ): CodeAction[] {
    const messages = context.diagnostics.filter((m): m is Message => m instanceof Message);
    const actions = [];
    for (const m of messages) {
      const action = this.createAction(m, document);
      if (action) {
        actions.push(action);
      }
    }
    if (context.only) {
      return actions.filter(a => a.kind === context.only);
    }
    return actions;
  }

  public createAction(m: Message, document: TextDocument): CodeAction | undefined {
    const edit = m.edit;
    if (!edit) {
      return;
    }
    const original = document.getText(m.range);
    if (original !== m.arcMessage.original) {
      debug(`Text changed:\nA: ${inspect(original)}\nB: ${inspect(m.arcMessage.original)}`);
      return;
    }
    const action = new CodeAction(m.message, m.actionKind);
    action.isPreferred = true;
    action.diagnostics = [m];
    action.edit = new WorkspaceEdit();
    action.edit.replace(document.uri, edit.range, edit.newText);
    return action;
  }
}
