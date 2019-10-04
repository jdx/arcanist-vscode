import {
  CancellationToken,
  DiagnosticCollection,
  DocumentFormattingEditProvider,
  FormattingOptions,
  TextDocument,
  TextEdit,
  window,
} from "vscode";
import { runArcDiff } from "./arc";
import { debug, log } from "./debug";
import Message from "./message";

export default class ArcFormattingEditProvider implements DocumentFormattingEditProvider {
  public static diags: DiagnosticCollection;
  public async provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions,
    token: CancellationToken,
  ): Promise<TextEdit[]> {
    try {
      const diags = ArcFormattingEditProvider.diags;
      token.onCancellationRequested(() => debug("cancelled"));
      const { fileName } = document;
      debug(`formatting ${fileName}`);
      // clear any old diagnostics
      diags.set(document.uri, []);

      if (document.isDirty) {
        debug("saving before editing");
        await document.save();
        if (token.isCancellationRequested) { return []; }
      }

      const output = await runArcDiff(fileName);
      if (token.isCancellationRequested) { return []; }

      const messages = output
        .map((m) => {
          try {
            return new Message(m, document);
          } catch (err) {
            log(err);
            window.showErrorMessage(err.stack);
          }
        })
        .filter((m): m is Message => !!m);
      debug(messages);

      const edits = [];
      const errors = [];
      for (const m of messages) {
        const edit = m.edit;
        if (edit && m.arcMessage.severity === "autofix") { edits.push(edit); }
        else { errors.push(m); }
      }

      diags.set(document.uri, errors);

      return edits;
    } catch (err) {
      log(err);
      throw err;
    }
  }
}
