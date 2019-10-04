import { CodeActionKind, Diagnostic, DiagnosticSeverity, Range, TextDocument, TextEdit } from "vscode";
import { ArcMessage } from "./arc";

export default class Message extends Diagnostic {
  get patchText() {
    if (!this.arcMessage.replacement) { return; }
    if (this.arcMessage.replacement === this.arcMessage.original) { return; }
    return this.arcMessage.replacement;
  }
  get actionKind() {
    return CodeActionKind.QuickFix;
  }
  get edit() {
    const patchText = this.patchText;
    if (patchText === undefined) { return; }
    return new TextEdit(this.range, patchText);
  }
  public static getRange({ char, line, original }: ArcMessage, document: TextDocument): Range {
    line = line || 0; // it can return null
    if (char === null || original === null) { return document.lineAt(line).range; }
    const lines = original.split("\n");
    const endLine = line + lines.length - 2;
    const endChar = lines[lines.length - 1].length;
    return new Range(line - 1, char - 1, endLine, endChar);
  }
  public static getSeverity({ severity }: ArcMessage): DiagnosticSeverity {
    if (severity === "warning") { return DiagnosticSeverity.Warning; }
    if (severity === "autofix") { return DiagnosticSeverity.Information; }
    if (severity === "advice") { return DiagnosticSeverity.Information; }
    // TODO: maybe disable this instead?
    if (severity === "disabled") { return DiagnosticSeverity.Information; }
    return DiagnosticSeverity.Error;
  }
  public arcMessage: ArcMessage;
  constructor(message: ArcMessage, document: TextDocument) {
    const range = Message.getRange(message, document);
    const msg = [message.name, message.description].join("\n").trim();
    const severity = Message.getSeverity(message);
    super(range, msg, severity);
    this.source = `arc: ${message.code}(${message.severity})`;
    this.arcMessage = message;
  }
}
