import {
	type Format,
	type ImageOptions,
	formats,
	imageNumberOptionKeys,
	imageOptionKeys,
} from '../constants';

export function matchParentPath(url: URL, parent = 'image'): boolean {
	const match = new RegExp(`(?<=^\/)${parent}`).exec(url.pathname);

	return match?.[0] ? match[0] === parent : false;
}

export function getImageUrl(url: URL): string {
	console.log('HOGE path name', url.pathname);
	const match = /https\:\/.+$/.exec(url.pathname);

	return match?.[0] ? match[0] : '';
}

export function getOptionsString(url: URL): string {
	const match = /(?<=^\/image\/)[^\/]+(?=\/)/.exec(url.pathname);

	return match?.[0] ? match[0] : '';
}

export function getOptionsMap(optionsString: string): ImageOptions {
	const res = {};
	if (!optionsString) {
		return res;
	}

	const arr = optionsString.split(',').map((str) => str.split('='));

	for (const key of imageOptionKeys) {
		const target = arr.find((op) => op[0] === key);
		if (target?.[1]) {
			let value: number | string | undefined;
			if (imageNumberOptionKeys.includes(key)) {
				try {
					value = Number(target[1]) || undefined;
				} catch (error) {
					value = undefined;
				}
			} else {
				// format
				value = formats.includes(target[1] as Format) ? target[1] : undefined;
			}

			Object.assign(res, { [key]: value });
		}
	}

	return res;
}
