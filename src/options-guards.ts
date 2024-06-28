import { type Format, formats } from './constants';

export function qualityGuard(quality: number | undefined): boolean {
	if (!quality) {
		return true;
	}
	if (0 >= quality || quality > 100) {
		return false;
	}

	return true;
}

export function widthGuard(width: number | undefined): boolean {
	if (!width) {
		return true;
	}
	if (0 >= width || width > 2500) {
		return false;
	}

	return true;
}

export function heightGuard(height: number | undefined): boolean {
	if (!height) {
		return true;
	}
	if (0 >= height || height > 2500) {
		return false;
	}

	return true;
}

export function formatGuard(format: string | undefined): boolean {
	if (!format) {
		return true;
	}
	if (!formats.includes(format as Format)) {
		return false;
	}

	return true;
}
