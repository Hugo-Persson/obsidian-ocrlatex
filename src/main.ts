import { App, MarkdownView, Plugin, PluginSettingTab, Setting } from "obsidian";

// @ts-ignore "electron" is installed.
import { clipboard } from "electron";

import fetch from "node-fetch";
import FormData from "form-data";

import { SimpleTexResponse } from "./SimpleTexResponse";

interface OCRLatexPluginSettings {
	token: string;
}

const DEFAULT_SETTINGS: OCRLatexPluginSettings = {
	token: "",
};

export default class OCRLatexPlugin extends Plugin {
	settings: OCRLatexPluginSettings;

	async sendSimpleTexRequest(image: Uint8Array): Promise<SimpleTexResponse> {
		const formData = new FormData();

		formData.append("file", image, {
			filename: "test.png",
			contentType: "image/png",
		});

		const url = "https://server.simpletex.cn/api/latex_ocr";
		const response = await fetch(url, {
			method: "POST",
			headers: {
				token: this.settings.token,
			},
			body: formData,
		});
		if (!response.ok) response; // Not a ok response, we throw here and let method calling to show error message

		const data: SimpleTexResponse =
			(await response.json()) as SimpleTexResponse;
		return data;
	}

	async insertLatexFromClipboard() {
		console.log(clipboard.availableFormats());
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const cursor = view?.editor.getCursor();
		const editor = view?.editor;
		if (!cursor || !editor) {
			alert(
				"No focus on editor, please insert cursor in a document then run command again."
			);
			return;
		}
		const hasImageCopied =
			clipboard.availableFormats().includes("image/png") ||
			clipboard.availableFormats().includes("image/jpeg");
		if (!hasImageCopied) {
			alert(
				"No image found in clipboard, please copy an image then run command again."
			);
			return;
		}

		const loadingText = `Loading latex...`;
		editor.replaceRange(loadingText, cursor);
		editor.setCursor({
			line: cursor.line,
			ch: cursor.ch + loadingText.length,
		});
		const image = clipboard.readImage().toPNG();
		const data = await this.sendSimpleTexRequest(image);
		console.log(data);
		const parsedLatex = `$$ ${data.res.latex}$$`;

		view?.editor.replaceRange(parsedLatex, cursor, {
			// Insert the response
			ch: cursor.ch + loadingText.length, // We replace the loading text
			line: cursor.line,
		});
	}

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "generate-latex-from-last-image",
			name: "Generate latex from last image to clipboard",
			callback: () => {
				this.insertLatexFromClipboard();
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new OCRLatexSettings(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class OCRLatexSettings extends PluginSettingTab {
	plugin: OCRLatexPlugin;

	constructor(app: App, plugin: OCRLatexPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Your token")
			.setDesc(
				"The token for SimpleTEX, see how to get here https://github.com/Hugo-Persson/obsidian-ocrlatex"
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter your token")
					.setValue(this.plugin.settings.token)
					.onChange(async (value) => {
						this.plugin.settings.token = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
