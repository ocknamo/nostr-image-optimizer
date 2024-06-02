import { optimizeImage } from "wasm-image-optimization";
import { getImageUrl } from "./url-parse/url-parse";

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		// fetch()

		if (request.method !== "GET") {
			return new Response(null, {
				status: 405,
				statusText: "Method Not Allowed",
			});
		}

		const path = getImageUrl(request.url);

		let pathUrl;
		// path is should be URL
		try {
			pathUrl = new URL(path);
		} catch (error) {
			return new Response(null, {
				status: 400,
				statusText: "Bad Request",
			});
		}

		// url should be image. eg png, jpg, jpeg.
		if (
			!pathUrl.href.endsWith(".png") &&
			!pathUrl.href.endsWith(".jpg") &&
			!pathUrl.href.endsWith(".jpeg")
		) {
			return new Response(null, {
				status: 400,
				statusText: "Bad Request",
			});
		}

		const image: ArrayBuffer = await (await fetch(pathUrl))
			.arrayBuffer()
			.then((v) => v);
		// TODO: gurd file type

		// TODO: width=100,height300とかで設定できるようにする
		// 以下の例のように設定
		// /width=80,height=100,quality=75,format=webp/uploads/avatar1.jpg
		// この３つとformatだけでしばらくは良さそう

		const optimized = await optimizeImage({
			image,
			width: 100,
			format: "webp",
		});

		return new Response(optimized);
	},
};
