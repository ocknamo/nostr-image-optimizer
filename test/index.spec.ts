import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect, inject, beforeAll } from 'vitest';
import worker from '../src/index';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('index.ts', () => {
  let testImage01: ArrayBuffer;
  beforeAll(() => {
    const testImages = inject('testImages')
    const testImage01String = testImages['image01'];
    testImage01 = Uint8Array.from(atob(testImage01String), c => c.charCodeAt(0)).buffer
  });

  it('should return optimized image', async () => {
    // check original image soze.
    expect(testImage01.byteLength).toBe(67171);
		const request = new IncomingRequest('http://example.com/image/width=100,quality=50,format=webp/https://test.jpg');

    // mock
    global.fetch = () => ({ ok: true, headers: { get: () => undefined }, arrayBuffer: () => new Promise<ArrayBuffer>((resolve) => resolve(testImage01) )  }) as any;

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toMatchInlineSnapshot(`200`);
		expect(response.ok).toMatchInlineSnapshot(`true`);
    const res = await response.arrayBuffer();
    expect(res.byteLength).lessThan(3000)
	});

	it('should be failed with invalid url', async () => {
		const request = new IncomingRequest('http://example.com');
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toMatchInlineSnapshot('400');
	});
});