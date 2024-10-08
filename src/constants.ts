export type AllowedImageMimeType = 'image/png' | 'image/jpeg' | 'image/webp';

export type Format = 'webp' | 'jpeg' | 'png';
export const formats: Format[] = ['webp', 'jpeg', 'png'];
export const formatMimeTypeMap: Record<Format, AllowedImageMimeType> = {
	jpeg: 'image/jpeg',
	png: 'image/png',
	webp: 'image/webp',
};

export interface ImageOptions {
	width?: number;
	height?: number;
	quality?: number;
	format?: Format;
}

export const imageOptionKeys: (keyof ImageOptions)[] = [
	'width',
	'height',
	'quality',
	'format',
];

export const imageNumberOptionKeys: (keyof ImageOptions)[] = [
	'width',
	'height',
	'quality',
];
