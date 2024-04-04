
import { App, MarkdownView, Plugin, PluginSettingTab, Setting } from "obsidian";

type LatexProvider = "SimpleTex" | "Pix2Tex";
export interface OCRLatexPluginSettings {
	simpleTexToken: string;
	texify:{
		url: string;
		username: string;
		password: string;
	},
	pix2tex:{
		url: string;
		username: string;
		password: string;
	},
	latexProvider: LatexProvider;
}

export interface SelfHostedSettings {
	url: string;
	username: string;
	password: string;
}

export const DEFAULT_SETTINGS: OCRLatexPluginSettings = {
	simpleTexToken: "",
	latexProvider: "SimpleTex",
	texify:{
		url: "http://127.0.0.1:5000/predict",
		username: "",
		password: "",
	},
	pix2tex:{
		url: "http://127.0.0.1:8502/predict/",
		username: "",
		password: "",
	},

};

import OCRLatexPlugin from "./main";
export default class OCRLatexSettings extends PluginSettingTab {
	plugin: OCRLatexPlugin;

	renderSelfHostedOptions(obj: SelfHostedSettings, containerEl:HTMLElement, endWithSlash: boolean) {
		new Setting(containerEl)
			.setName("URL")
			.setDesc(
				"The URL for the API endpoint, only active when self-hosted is enabled.",
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter your URL")
					.setValue(obj.url)
					.onChange(async (value) => {
						if (!value.endsWith("/") && endWithSlash) value += "/";
						if(value.endsWith("/") && !endWithSlash) value = value.slice(0, -1);
						obj.url = value;
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
					.setValue(obj.username)
					.onChange(async (value) => {
						obj.username = value;
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
					.setValue(obj.password)
					.onChange(async (value) => {
						obj.password = value;
						await this.plugin.saveSettings();
					})
			);
		
	}

	constructor(app: App, plugin: OCRLatexPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		const readmeURL= "https://github.com/Hugo-Persson/obsidian-ocrlatex/blob/master/README.md"
		containerEl.createEl("h1", { text: "Image2Latex" });
		containerEl.createEl("div", {text: "Please see the README.md for info on how to configure the extension"})
		containerEl.createEl("a", {href:readmeURL, text: readmeURL})
		containerEl.createEl("h2", { text: "General" });
		new Setting(containerEl).setName("Latex provider").setDesc("Choose which provider to use for OCR and Latex conversion").addDropdown((dropdown) => {
			dropdown.addOptions({
				"SimpleTex": "SimpleTex",
				"Pix2Tex": "Pix2Tex",
			}).setValue(this.plugin.settings.latexProvider).onChange(async (value) => {

				this.plugin.settings.latexProvider = value as LatexProvider;
				await this.plugin.saveSettings();
			});
		});

		containerEl.createEl("h2", { text: "Texify" });
		this.renderSelfHostedOptions(this.plugin.settings.texify, containerEl, false);

		containerEl.createEl("h2", { text: "Pix2Tex" });
		this.renderSelfHostedOptions(this.plugin.settings.pix2tex, containerEl, true);


		containerEl.createEl("h2", { text: "SimpleTex" });
		new Setting(containerEl)
			.setName("Token")
			.setDesc(
				"Your SimpleTexToken, see README.md for more info.",
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter token...")
					.setValue(this.plugin.settings.simpleTexToken)
					.onChange(async (value) => {
						this.plugin.settings.simpleTexToken = value;
						await this.plugin.saveSettings();
					})
			);

	}
}
