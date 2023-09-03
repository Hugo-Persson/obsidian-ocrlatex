import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

// @ts-ignore "electron" is installed.
import { clipboard } from "electron";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	ocrBaseUrl: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	ocrBaseUrl: "",
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async generateLatexFromClipboardImage() {
		//let buffer = clipboard.readImage();
		//let buffer = clipboard.readBuffer();
		//console.log(buffer);
		console.log(clipboard.availableFormats());
		console.log(clipboard.readImage());
		if (clipboard.availableFormats()[0] == "image/png") {
			let buffer = clipboard.readBuffer("image/png");
			let formData = new FormData();
			formData.append("file", buffer);
			const url = this.settings.ocrBaseUrl + "/buffer/";
			let response = await fetch(url, {
				method: "POST",
				body: formData,
			});
			let latex = await response.text();
			console.log(latex);
			console.log(buffer);
		}
		return "";
	}

	async onload() {
		await this.loadSettings();

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "generate-latex-from-last-image",
			name: "Generate latex from last image to clipboard",
			callback: () => {
				let latex = this.generateLatexFromClipboardImage();
				alert(latex);
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				console.log(await editor.getSelection());
				editor.replaceSelection("Sample Editor Command");
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open sample modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
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

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("OCR BASE_URL")
			.setDesc("The base url for your OCR server")
			.addText((text) =>
				text
					.setPlaceholder("Enter your BASE_URL")
					.setValue(this.plugin.settings.ocrBaseUrl)
					.onChange(async (value) => {
						this.plugin.settings.ocrBaseUrl = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
