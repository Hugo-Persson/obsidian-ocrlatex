import { App, MarkdownView, Plugin, PluginSettingTab, Setting } from "obsidian";

// @ts-ignore "electron" is installed.
import { clipboard } from "electron";

import fetch from "node-fetch";
import FormData from "form-data";

import { SimpleTexResponse } from "./SimpleTexResponse";
import OCRProvider from "./ocr-provider";
import Pic2Tex from "./pic2tex";
import SimpleTex from "./simple-tex";
import Texify from "./texify";

interface OCRLatexPluginSettings {
	token: string;
	selfHosted: boolean;
	url: string;
	username: string;
	password: string;
}

const DEFAULT_SETTINGS: OCRLatexPluginSettings = {
	token: "",
	selfHosted: false,
	url: "https://server.simpletex.cn/api/latex_ocr",
	username: "",
	password: "",
};

const loadingText = `Loading latex...`;
export default class OCRLatexPlugin extends Plugin {
	settings: OCRLatexPluginSettings;

	private getClipboardImage(): Uint8Array | null {
		const hasImageCopied = clipboard.availableFormats().includes("image/png") ||
			clipboard.availableFormats().includes("image/jpeg");
		if (!hasImageCopied) {
			alert(
				"No image found in clipboard, please copy an image then run command again.",
			);
			return null;
		}
		return clipboard.readImage().toPNG();
	}

	private insertLoadingText() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const cursor = view?.editor.getCursor();
		const editor = view?.editor;
		if (!cursor || !editor) {
			alert(
				"No focus on editor, please insert cursor in a document then run command again.",
			);
			return;
		}
		editor.replaceRange(loadingText, cursor);
		editor.setCursor({
			line: cursor.line,
			ch: cursor.ch + loadingText.length,
		});
	}

	private insertResponseToEditor(res: string) {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const cursor = view?.editor.getCursor();
		const editor = view?.editor;
		if (!cursor || !editor) {
			alert(
				"No focus on editor, please insert cursor in a document then run command again.",
			);
			return;
		}
		view?.editor.replaceRange(res, cursor, {
			// Insert the response
			ch: cursor.ch + loadingText.length, // We replace the loading text
			line: cursor.line,
		});
	}

	private async insert(provider: OCRProvider) {
		try {
			const image = this.getClipboardImage();
			if (!image) return;
			this.insertLoadingText();
			const parsedLatex = await provider.sendRequest(image);
			this.insertResponseToEditor(parsedLatex);
		} catch (error) {
			console.error(error);
			alert(
				"Error while fetching latex, please check the console for more information.",
			);
		}
	}

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "generate-latex-from-last-image-multiline",
			name: "Generate multiline LaTeX from last image to clipboard",
			callback: () => {
				this.insert(
					this.settings.selfHosted
						? new Pic2Tex(true, this.settings)
						: new SimpleTex(true, this.settings),
				);
			},
		});

		this.addCommand({
			id: "generate-latex-from-last-image-inline",
			name: "Generate inline LaTeX from last image to clipboard",
			callback: () => {
				this.insert(
					this.settings.selfHosted
						? new Pic2Tex(true, this.settings)
						: new SimpleTex(true, this.settings),
				);
			},
		});

		this.addCommand({
			id: "generate-markdown-from-last-image",
			name: "Generate markdown from last image to clipboard using Texify",
			callback: async () => {
				this.insert(new Texify());
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
			await this.loadData(),
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
				"The token for SimpleTEX, see how to get here https://github.com/Hugo-Persson/obsidian-ocrlatex",
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
			.setDesc(
				"Enable this option if you want to use a self-hosted Docker API.",
			)
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
			.setDesc(
				"The URL for the API endpoint, only active when self-hosted is enabled.",
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter your URL")
					.setValue(this.plugin.settings.url)
					.onChange(async (value) => {
						if (!value.endsWith("/")) value += "/";
						this.plugin.settings.url = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Username (self-hosted optional)")
			.setDesc(
				"Your username for authentication. If you use self-hosted and a basic auth proxy before the container.",
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter your username")
					.setValue(this.plugin.settings.username)
					.onChange(async (value) => {
						this.plugin.settings.username = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Password (self-hosted optional)")
			.setDesc(
				"Your password for authentication. If you use self-hosted and a basic auth proxy before the container.",
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter your password")
					.setValue(this.plugin.settings.password)
					.onChange(async (value) => {
						this.plugin.settings.password = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
