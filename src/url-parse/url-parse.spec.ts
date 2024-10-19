import { describe, expect, it } from 'vitest';
import {
	getImageUrl,
	getOptionsMap,
	getOptionsString,
	matchParentPath,
} from './url-parse';

describe('url-parse', () => {
	describe('matchParentPath', () => {
		it('it is matched parent path.', () => {
			expect(
				matchParentPath(
					new URL(
						'https://nostr-image-optimizer.s14pes.workers.dev/image/width=80,height=100,quality=75,format=webp/https://image.nostr.build/test.jpg',
					),
					'image',
				),
			).toBe(true);
		});

		it('it is matched parent path without options.', () => {
			expect(
				matchParentPath(
					new URL(
						'https://nostr-image-optimizer.s14pes.workers.dev/image//https://image.nostr.build/test.jpg',
					),
					'image',
				),
			).toBe(true);
		});

		it('it is not matched path with invalid path.', () => {
			expect(
				matchParentPath(
					new URL(
						'https://nostr-image-optimizer.s14pes.workers.dev/invalid//https://image.nostr.build/test.jpg',
					),
					'image',
				),
			).toBe(false);
		});
	});

	describe('getImageUrl', () => {
		it('should get image full url with options.', () => {
			expect(
				getImageUrl(
					new URL(
						'https://nostr-image-optimizer.s14pes.workers.dev/image/width=80,height=100,quality=75,format=webp/https://image.nostr.build/test.jpg',
					),
				),
			).toBe('https://image.nostr.build/test.jpg');
		});

		it('should get image full url with single slash', () => {
			expect(
				getImageUrl(
					new URL(
						'https://nostr-image-optimizer.s14pes.workers.dev/image/width=80,height=100,quality=75,format=webp/https:/image.nostr.build/test.jpg',
					),
				),
			).toBe('https:/image.nostr.build/test.jpg');
		});

		it('should get image full url without options.', () => {
			expect(
				getImageUrl(
					new URL(
						'https://nostr-image-optimizer.s14pes.workers.dev/image//https://image.nostr.build/test.jpg',
					),
				),
			).toBe('https://image.nostr.build/test.jpg');
		});
	});

	describe('getOptionsString', () => {
		it('should get options string with full option', () => {
			expect(
				getOptionsString(
					new URL(
						'https://nostr-image-optimizer.s14pes.workers.dev/image/width=80,height=100,quality=75,format=webp/https://image.nostr.build/test.jpg',
					),
				),
			).toBe('width=80,height=100,quality=75,format=webp');
		});

		it('should get empty string with no option', () => {
			expect(
				getOptionsString(
					new URL(
						'https://nostr-image-optimizer.s14pes.workers.dev/image//https://image.nostr.build/test.jpg',
					),
				),
			).toBe('');
		});
	});

	describe('getOptionsMap', () => {
		it('should get empty object with empty string', () => {
			expect(getOptionsMap('')).toEqual({});
		});

		it('should get options map with full option string', () => {
			expect(
				getOptionsMap('width=80,height=100,quality=75,format=webp'),
			).toEqual({
				width: 80,
				height: 100,
				quality: 75,
				format: 'webp',
			});
		});

		it('should get options map with lack option string', () => {
			expect(getOptionsMap('width=80,quality=75,format=webp')).toEqual({
				width: 80,
				quality: 75,
				format: 'webp',
			});
		});

		it('should get options map with invalid option string', () => {
			expect(getOptionsMap('w=80,h=75,format=svg')).toEqual({});

			expect(getOptionsMap('width=80quality=75format=webp')).toEqual({});

			expect(getOptionsMap('h2uihdj-=+++,,,')).toEqual({});
		});

		it('should get options map with part of invalid option string', () => {
			expect(getOptionsMap('width=80,h=75,format=svg')).toEqual({
				width: 80,
			});
		});
	});
});
