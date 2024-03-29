import OCRProvider from "./ocr-provider";

export default abstract class TexWrapper implements OCRProvider {
	private isMultiline = false;
	constructor(isMultiline: boolean) {
		this.isMultiline = isMultiline;
	}

	abstract getTex(image: Uint8Array): Promise<string>;

	async sendRequest(image: Uint8Array): Promise<string> {
		const res = await this.getTex(image);
		if (this.isMultiline) return `$$ ${res}$$`;
		return `$${res}$`;
	}
}
