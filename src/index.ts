import { optimizeImage } from 'wasm-image-optimization';
import {
	getImageUrl,
	getOptionsMap,
	getOptionsString,
	matchParentPath,
} from './url-parse/url-parse';
import {
	allowedMaxImageFileSize,
	formatMimeTypeMap,
	formats,
} from './constants';
import {
	formatGuard,
	heightGuard,
	qualityGuard,
	widthGuard,
} from './options-guards';

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

		// parent path should be `image`
		if (!matchParentPath(requestURL, 'image')) {
			return new Response(null, {
				status: 400,
				statusText: 'Bad Request',
			});
		}

		const path = getImageUrl(requestURL);
		const optionsMap = getOptionsMap(getOptionsString(requestURL));

		let pathUrl;
		// path is should be URL
		try {
			pathUrl = new URL(path);
		} catch (error) {
			console.warn(`Invalid url: `, path);
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
			console.warn(`Invalid request option: `, optionsMap);
			return new Response(null, {
				status: 400,
				statusText: 'Bad Request',
			});
		}

		console.info('start fetch to: ', pathUrl);
		const response = await fetch(pathUrl);
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
				`Exceed image file size limit. Image byte length is: ${image.byteLength}`,
			);
			return new Response(null, {
				status: 400,
				statusText: 'Bad Request',
			});
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
			formatMimeTypeMap[optionsMap.format ?? 'jpeg'],
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

		// TODO: Add CORS header

		return res;
	},
};
