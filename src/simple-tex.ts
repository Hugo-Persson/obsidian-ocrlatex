import OCRProvider from "./ocr-provider";
import fetch from "node-fetch";
import FormData from "form-data";
import { TexifyResponse } from "./TexifyResponse";
import TexWrapper from "./tex-wrapper";
import { SimpleTexResponse } from "./SimpleTexResponse";

// Simpletex is web service that converts images to latex
export default class SimpleTex extends TexWrapper {
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
		response = await fetch(this.settings.url, {
			method: "POST",
			headers: {
				token: this.settings.token,
			},
			body: formData,
		});

		if (!response.ok) response; // Not a ok response, we throw here and let method calling to show error message

		const data: SimpleTexResponse =
			(await response.json()) as SimpleTexResponse;
		return data.res.latex;
	}
}
