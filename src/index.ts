import { optimizeImage } from 'wasm-image-optimization';
import {
	getImageUrl,
	getOptionsMap,
	getOptionsString,
	matchParentPath,
} from './url-parse/url-parse';
import { allowedMaxImageFileSize, allowedMinImageFileSize } from './constants';
import {
	formatGuard,
	heightGuard,
	qualityGuard,
	widthGuard,
} from './options-guards';
import { appendCustomHeaders } from './header';

const REMOTE_TIME_OUT = 5000;

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		if (request.method !== 'GET') {
			return new Response(null, {
				status: 405,
				statusText: 'Method Not Allowed',
			});
		}

		const requestURL = new URL(request.url);

		// cache
		const cacheKey = new Request(requestURL.toString(), request);
		const cache = caches.default;
		const cacheResponse = await cache.match(cacheKey);

		if (cacheResponse) {
			console.info(`Cache hit for: ${request.url}.`);
			return cacheResponse;
		}

		console.info(
			`Response for request url: ${request.url} not present in cache. Fetching and caching request.`,
		);

		// TODO: set from config.
		// parent path should be `image`
		if (!matchParentPath(requestURL, 'image')) {
			return new Response(null, {
				status: 400,
				statusText: 'Bad Request',
			});
		}

		const path = getImageUrl(requestURL);
		const optionsMap = getOptionsMap(getOptionsString(requestURL));

		let pathUrl: URL;
		// path is should be URL
		try {
			pathUrl = new URL(path);
		} catch (error) {
			console.warn('Invalid url: ', path);
			return new Response(null, {
				status: 400,
				statusText: 'Bad Request',
			});
		}

		// Recursive requests guard
		if (requestURL.origin === pathUrl.origin) {
			console.warn('Invalid recursive requests. url: ', path);
			return new Response(null, {
				status: 400,
				statusText: 'Bad Request',
			});
		}

		// options guards
		if (
			!qualityGuard(optionsMap.quality) ||
			!widthGuard(optionsMap.width) ||
			!heightGuard(optionsMap.height) ||
			!formatGuard(optionsMap.format)
		) {
			console.warn('Invalid request option: ', optionsMap);
			return new Response(null, {
				status: 400,
				statusText: 'Bad Request',
			});
		}

		console.info('start fetch to: ', pathUrl.href);
		const response = await fetch(pathUrl, {
			headers: request.headers,
			signal: AbortSignal.timeout(REMOTE_TIME_OUT),
		});
		console.info('end fetch');

		if (!response.ok) {
			return new Response(null, {
				status: response.status,
				statusText: response.statusText,
			});
		}

		console.info('start getting arrayBuffer');
		const image = await response.arrayBuffer();
		console.info('end getting arrayBuffer');

		if (image.byteLength > allowedMaxImageFileSize) {
			console.warn(
				`Return original image, because the image file size limit is violated. Image byte length is: ${image.byteLength}`,
			);

			let res = new Response(image);
			res = appendCustomHeaders(res, response, optionsMap);

			// Set chache
			ctx.waitUntil(cache.put(cacheKey, res.clone()));

			return res;
		}

		if (image.byteLength < allowedMinImageFileSize) {
			console.warn(
				`Return original image because the image size is smaller than the minimum. Image byte length is: ${image.byteLength}`,
			);

			let res = new Response(image);
			res = appendCustomHeaders(res, response, optionsMap);

			// Set chache
			ctx.waitUntil(cache.put(cacheKey, res.clone()));

			return res;
		}

		console.info('start optimizeImage');
		const optimized = await optimizeImage({
			image,
			...optionsMap,
		});
		console.info('end optimizeImage');

		let res = new Response(optimized);
		res = appendCustomHeaders(res, response, optionsMap);

		// Set chache
		ctx.waitUntil(cache.put(cacheKey, res.clone()));

		return res;
	},
};
