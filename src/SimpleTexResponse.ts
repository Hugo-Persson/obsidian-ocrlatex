export interface SimpleTexResponse {
	status: boolean;
	res: Res;
	request_id: string;
}

export interface Res {
	conf: number;
	latex: string;
}
