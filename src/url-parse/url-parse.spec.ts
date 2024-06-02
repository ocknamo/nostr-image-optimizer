import { describe, expect, it } from "vitest";
import { getImageUrl } from "./url-parse";

describe("url-parse", () => {
	it("getImageUrl", () => {
		expect(
			getImageUrl(
				"https://remote-url-img-optimaization-cf-worker.s14pes.workers.dev/https://image.nostr.build/test.jpg",
			),
		).toBe("https://image.nostr.build/test.jpg");
	});
});
