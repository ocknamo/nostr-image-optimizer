import { formatMimeTypeMap, type ImageOptions } from './constants';

/**
 * Append headers for succsess response.
 * @param res
 */
export function appendCustomHeaders(
	res: Response,
	originalResponse: Awaited<ReturnType<typeof fetch>>,
	optionsMap: ImageOptions,
): Response {
	res.headers.append(
		'Content-Type',
		formatMimeTypeMap[optionsMap.format ?? 'webp'],
	);

	// TODO: Inject from config
	res.headers.append(
		'Cache-Control',
		'public, max-age=86400, stale-while-revalidate=7200, stale-if-error=3600, s-maxage=1209600',
	);

	const etag = originalResponse.headers.get('ETAG');
	if (etag) {
		res.headers.append('ETAG', etag);
	}
	const lastModified = originalResponse.headers.get('LAST-MODIFIED');
	if (lastModified) {
		res.headers.append('LAST-MODIFIED', lastModified);
	}

	// TODO: Add CORS header

	return res;
}
