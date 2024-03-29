export default interface OCRProvider {
	sendRequest(image: Uint8Array): Promise<string>;
}

