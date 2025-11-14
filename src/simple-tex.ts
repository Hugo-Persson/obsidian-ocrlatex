import OCRProvider from "./ocr-provider";
import fetch from "node-fetch";
import FormData from "form-data";
import { TexifyResponse } from "./TexifyResponse";
import TexWrapper from "./tex-wrapper";
import { SimpleTexResponse } from "./SimpleTexResponse";
import { OCRLatexPluginSettings } from "./settings";

// Simpletex is web service that converts images to latex
export default class SimpleTex extends TexWrapper {
	settings: OCRLatexPluginSettings;

	constructor(isMultiline: boolean, settings: OCRLatexPluginSettings) {
		super(isMultiline);
		this.settings = settings;
	}

	async getTex(image: Uint8Array): Promise<string> {
		const formData = new FormData();

		formData.append("file", image, {
			filename: "test.png",
			contentType: "image/png",
		});

		let response;
		response = await fetch("https://server.simpletex.cn/api/latex_ocr_turbo", {
			method: "POST",
			headers: {
				token: this.settings.simpleTexToken,
			},
			body: formData,
		});

		if (!response.ok) {
			console.error("Simpletext response", response); // Not a ok response, we throw here and let method calling to show error message
			alert("Simple TEX not working properly, see logs.")
		}
		const resText = await response.text();
		console.log("Simple tex response", resText);
		const data: SimpleTexResponse = (JSON.parse(resText)) as SimpleTexResponse;
		console.log("Simple tex data");
		return data.res.latex;
	}
}
