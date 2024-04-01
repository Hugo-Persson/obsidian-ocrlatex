import { App, MarkdownView, Plugin, PluginManifest } from "obsidian";

// @ts-ignore "electron" is installed.
import { clipboard } from "electron";

import OCRProvider from "./ocr-provider";
import Pic2Tex from "./pic2tex";
import SimpleTex from "./simple-tex";
import Texify from "./texify";
import OCRLatexSettings, {
	DEFAULT_SETTINGS,
	OCRLatexPluginSettings,
} from "./settings";
import EditorInteract from "./editor-interact";

const loadingText = `Loading latex...`;

function getLatexProvider(
	isMultiline: boolean,
	settings: OCRLatexPluginSettings,
): OCRProvider {
	if (settings.latexProvider === "SimpleTex") {
		return new SimpleTex(isMultiline, settings);
	} else {
		return new Pic2Tex(isMultiline, settings);
	}
}

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

	private async insert(provider: OCRProvider) {
		try {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!view) {
				alert("No markdown view found, please open a markdown file.");
				return;
			}

			const editorInteract = new EditorInteract(view);
			const image = this.getClipboardImage();
			if (!image) return;
			editorInteract.insertLoadingText();
			const parsedLatex = await provider.sendRequest(image);
			console.log(parsedLatex);
			editorInteract.insertResponseToEditor(parsedLatex);
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
					getLatexProvider(true, this.settings),
				);
			},
		});

		this.addCommand({
			id: "generate-latex-from-last-image-inline",
			name: "Generate inline LaTeX from last image to clipboard",
			callback: () => {
				this.insert(
					getLatexProvider(false, this.settings),
				);
			},
		});

		this.addCommand({
			id: "generate-markdown-from-last-image",
			name: "Generate markdown from last image to clipboard using Texify",
			callback: async () => {
				this.insert(new Texify(this.settings.texify));
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
