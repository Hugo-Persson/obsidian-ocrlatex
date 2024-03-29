import { Editor, EditorPosition, MarkdownView } from "obsidian";

const loadingText = `Loading latex...`;
export default class EditorInteract {
	view: MarkdownView;
	cursor: EditorPosition;
	editor: Editor;

	constructor(view: MarkdownView) {
		this.view = view;
		this.cursor = view.editor.getCursor();
		this.editor = view.editor;
	}

	insertLoadingText() {
		this.editor.replaceRange(loadingText, this.cursor);
		this.editor.setCursor({
			line: this.cursor.line,
			ch: this.cursor.ch + loadingText.length,
		});
	}

	insertResponseToEditor(res: string) {
		this.view.editor.replaceRange(res, this.cursor, {
			// Insert the response
			ch: this.cursor.ch + loadingText.length, // We replace the loading text
			line: this.cursor.line,
		});
	}
}
