
import OCRProvider from "./ocr-provider";
import fetch from "node-fetch";
import FormData from "form-data";
import { TexifyResponse } from "./TexifyResponse";
import TexWrapper from "./tex-wrapper";

export default class Pic2Tex  extends TexWrapper{
	settings: any;

	constructor(isMultiline: boolean, settings: any) {
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
			let options: any = {
				method: "POST",
				body: formData,
			};
			if (this.settings.username && this.settings.password) {
				options.headers = {
					Authorization: `Basic ${btoa(`${this.settings.username}:${this.settings.password}`)
						}`,
				};
			}
			response = await fetch(this.settings.url, options);

		if (!response.ok) throw response; // Not a ok response, we throw here and let method calling to show error message

			const jsonString = await response.text();
			// Remove the quotes at the start and end of the string
			let latexText = jsonString.substring(1, jsonString.length - 1);
			// Replace all occurrences of \\ with \
			latexText = latexText.replace(/\\\\/g, "\\");
			return latexText;

	}

}
