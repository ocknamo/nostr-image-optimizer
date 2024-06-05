import { optimizeImage } from "wasm-image-optimization";
import {
	getImageUrl,
	getOptionsMap,
	getOptionsString,
	matchParentPath,
} from "./url-parse/url-parse";
import {
	allowedMaxImageFileSize,
	formatMimeTypeMap,
	formats,
} from "./constants";
import {
	formatGuard,
	heightGuard,
	qualityGuard,
	widthGuard,
} from "./options-guards";

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		if (request.method !== "GET") {
			return new Response(null, {
				status: 405,
				statusText: "Method Not Allowed",
			});
		}

		const requestURL = new URL(request.url);

		// parent path should be `image`
		if (!matchParentPath(requestURL, "image")) {
			return new Response(null, {
				status: 400,
				statusText: "Bad Request",
			});
		}

		const path = getImageUrl(requestURL);
		const optionsMap = getOptionsMap(getOptionsString(requestURL));

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

		// options gurds
		if (
			!qualityGuard(optionsMap.quality) ||
			!widthGuard(optionsMap.width) ||
			!heightGuard(optionsMap.height) ||
			!formatGuard(optionsMap.format)
		) {
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

		const response = await fetch(pathUrl);

		if (!response.ok) {
			return new Response(null, {
				status: response.status,
				statusText: response.statusText,
			});
		}

		const image = await response.arrayBuffer();

		if (image.byteLength > allowedMaxImageFileSize) {
			return new Response(null, {
				status: 400,
				statusText: "Bad Request",
			});
		}

		const optimized = await optimizeImage({
			image,
			...optionsMap,
		});

		const res = new Response(optimized);

		res.headers.append(
			"Content-Type",
			formatMimeTypeMap[optionsMap.format ?? "jpeg"],
		);
		res.headers.append(
			"Cache-Control",
			"public, max-age=86400, stale-while-revalidate=7200, stale-if-error=3600, s-maxage=1209600",
		);

		const etag = response.headers.get("ETAG");
		if (etag) {
			res.headers.append("ETAG", etag);
		}
		const lastModified = response.headers.get("LAST-MODIFIED");
		if (lastModified) {
			res.headers.append("LAST-MODIFIED", lastModified);
		}

		return res;
	},
};
