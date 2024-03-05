import { App, MarkdownView, Plugin, PluginSettingTab, Setting } from "obsidian";

// @ts-ignore "electron" is installed.
import { clipboard } from "electron";

import fetch from "node-fetch";
import FormData from "form-data";

import { SimpleTexResponse } from "./SimpleTexResponse";

interface OCRLatexPluginSettings {
	token: string;
	selfHosted: boolean;
	url: string;
}

const DEFAULT_SETTINGS: OCRLatexPluginSettings = {
	token: "",
	selfHosted: false,
	url: "https://server.simpletex.cn/api/latex_ocr",
};

export default class OCRLatexPlugin extends Plugin {
	settings: OCRLatexPluginSettings;

	async sendSimpleTexRequest(image: Uint8Array): Promise<SimpleTexResponse> {
		const formData = new FormData();

		formData.append("file", image, {
			filename: "test.png",
			contentType: "image/png",
		});

		const response = await fetch(this.settings.url, {
			method: "POST",
			headers: {
				token: this.settings.token,
			},
			body: formData,
		});
		if (!response.ok) response; // Not a ok response, we throw here and let method calling to show error message

		if (this.settings.selfHosted) {
			const jsonString = await response.text();
			// Remove the quotes at the start and end of the string
			let latexText = jsonString.substring(1, jsonString.length - 1);
			// Replace all occurrences of \\ with \
			latexText = latexText.replace(/\\\\/g, '\\');
			const simpleTexResponse: SimpleTexResponse = {
				status: true,
				res: {
					latex: latexText,
					conf: 1,
				}, 
				request_id: "docker_request"
			};
			return simpleTexResponse;
		} else {
			const data: SimpleTexResponse = (await response.json()) as SimpleTexResponse;
			console.log(data);
			return data;
		}
	}

	async insertLatexFromClipboard(isMultiline = false) {
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
		
		let parsedLatex;
		if (isMultiline) parsedLatex = `$$ ${data.res.latex}$$`;
		else parsedLatex = `$${data.res.latex}$`;
		
		view?.editor.replaceRange(parsedLatex, cursor, {
			// Insert the response
			ch: cursor.ch + loadingText.length, // We replace the loading text
			line: cursor.line,
		});
	}

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "generate-latex-from-last-image-multiline",
			name: "Generate multiline LaTeX from last image to clipboard",
			callback: () => {
				this.insertLatexFromClipboard(true);
			},
		});

		this.addCommand({
			id: "generate-latex-from-last-image-inline",
			name: "Generate inline LaTeX from last image to clipboard",
			callback: () => {
				this.insertLatexFromClipboard(false);
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new OCRLatexSettings(this.app, this));
	}

	onunload() { }

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

		new Setting(containerEl)
			.setName("Use Docker")
			.setDesc("Enable this option if you want to use a self-hosted Docker API.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.selfHosted)
					.onChange(async (value) => {
						this.plugin.settings.selfHosted = value;
						await this.plugin.saveSettings();
						const pluginId = this.plugin.manifest.id;
					})
			);

		new Setting(containerEl)
		.setName("URL")
		.setDesc("The URL for the API endpoint, only active when self-hosted is enabled.")
		.addText((text) =>
			text
				.setPlaceholder("Enter your URL")
				.setValue(this.plugin.settings.url)
				.onChange(async (value) => {
					this.plugin.settings.url = value;
					await this.plugin.saveSettings();
				})
		);
	}
}
