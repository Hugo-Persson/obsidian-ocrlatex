import OCRProvider from "./ocr-provider";
import fetch from "node-fetch";
import FormData from "form-data";
import { TexifyResponse } from "./TexifyResponse";

export default class Texify implements OCRProvider {

	async sendRequest(image: Uint8Array): Promise<string> {
			const formData = new FormData();

			formData.append("image", image, {
				filename: "image.png",
				contentType: "image/png",
			});

			let options: any = {
				method: "POST",
				body: formData,
			};
			const response = await fetch("http://127.0.0.1:5000/predict", options);
			const parsed: TexifyResponse = (await response.json() as TexifyResponse);
			return parsed.results[0];

		}

	}
