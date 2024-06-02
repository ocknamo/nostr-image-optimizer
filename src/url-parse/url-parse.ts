export function getImageUrl(src: string): string {
	const url = new URL(src);

	return url.pathname.replace(new RegExp("^/"), "");
}
