import {
	Format,
	ImageOptions,
	formats,
	imageNumberOptionKeys,
	imageOptionKeys,
} from "../const";

export function getImageUrl(url: URL): string {
	const match = /https\:\/\/.+$/.exec(url.pathname) ?? "";

	return match && match[0] ? match[0] : "";
}

export function getOptionsString(url: URL): string {
	const match = /(?<=^\/)[^\/]+(?=\/)/.exec(url.pathname);

	return match && match[0] ? match[0] : "";
}

export function getOptionsMap(optionsString: string): ImageOptions {
	const res = {};
	if (!optionsString) {
		return res;
	}

	const arr = optionsString.split(",").map((str) => str.split("="));

	imageOptionKeys.forEach((key) => {
		const target = arr.find((op) => op[0] === key);
		if (target && target[1]) {
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
	});

	return res;
}
