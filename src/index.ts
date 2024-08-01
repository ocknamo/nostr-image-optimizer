import { optimizeImage } from 'wasm-image-optimization';
import {
	getImageUrl,
	getOptionsMap,
	getOptionsString,
	matchParentPath,
} from './url-parse/url-parse';
import {
	allowedMaxImageFileSize,
	allowedMinImageFileSize,
	formatMimeTypeMap,
	formats,
} from './constants';
import {
	formatGuard,
	heightGuard,
	qualityGuard,
	widthGuard,
} from './options-guards';

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

		// options gurds
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

		console.info('start fetch to: ', pathUrl);
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
				`The image file size limit is violated. Image byte length is: ${image.byteLength}`,
			);
			const errRes = new Response(null, {
				status: 400,
				statusText: 'Bad Request',
			});

			// Set chache
			ctx.waitUntil(cache.put(cacheKey, errRes.clone()));

			return errRes;
		}

		if (image.byteLength < allowedMinImageFileSize) {
			console.warn(
				`The image is returned as is because the image size is smaller than the minimum. Image byte length is: ${image.byteLength}`,
			);

			const errRes = new Response(image, { headers: response.headers });

			// Set chache
			ctx.waitUntil(cache.put(cacheKey, errRes.clone()));

			return errRes;
		}

		console.info('start optimizeImage');
		const optimized = await optimizeImage({
			image,
			...optionsMap,
		});
		console.info('end optimizeImage');

		const res = new Response(optimized);

		res.headers.append(
			'Content-Type',
			formatMimeTypeMap[optionsMap.format ?? 'webp'],
		);
		res.headers.append(
			'Cache-Control',
			'public, max-age=86400, stale-while-revalidate=7200, stale-if-error=3600, s-maxage=1209600',
		);

		const etag = response.headers.get('ETAG');
		if (etag) {
			res.headers.append('ETAG', etag);
		}
		const lastModified = response.headers.get('LAST-MODIFIED');
		if (lastModified) {
			res.headers.append('LAST-MODIFIED', lastModified);
		}

		if (optimized?.byteLength && optimized.byteLength > image.byteLength) {
			console.info(
				`Invalid optimize result. Original image byte length: ${image.byteLength}. Optimized image byte length: ${optimized?.byteLength}`,
			);

			const errRes = new Response(null, {
				status: 400,
				statusText: 'Bad Request',
			});

			// Set cache
			ctx.waitUntil(cache.put(cacheKey, errRes.clone()));

			return errRes;
		}

		// TODO: Add CORS header

		// Set chache
		ctx.waitUntil(cache.put(cacheKey, res.clone()));

		return res;
	},
};
