import { describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

import sharp from "sharp";

describe("work completion evidence processing", () => {
  test("normalizes accepted images to bounded WebP without EXIF metadata", async () => {
    const { prepareWorkEvidence } = await import(
      "@/server/infrastructure/storage/work-evidence"
    );
    const input = await sharp({
      create: {
        width: 48,
        height: 32,
        channels: 3,
        background: "#2f6b3f",
      },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    expect((await sharp(input).metadata()).exif).toBeDefined();

    const output = await prepareWorkEvidence(
      new File([Uint8Array.from(input)], "hasil.jpg", {
        type: "image/jpeg",
      }),
    );
    const metadata = await sharp(output.bytes).metadata();

    expect(output.mimeType).toBe("image/webp");
    expect(output.byteSize).toBeGreaterThan(0);
    expect(output.byteSize).toBeLessThanOrEqual(5 * 1024 * 1024);
    expect(output.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(metadata.format).toBe("webp");
    expect(metadata.exif).toBeUndefined();
  });

  test("rejects unsupported files and inputs above five megabytes", async () => {
    const { prepareWorkEvidence } = await import(
      "@/server/infrastructure/storage/work-evidence"
    );
    await expect(
      prepareWorkEvidence(
        new File(["not an image"], "hasil.gif", { type: "image/gif" }),
      ),
    ).rejects.toThrow("UNSUPPORTED_WORK_EVIDENCE");

    await expect(
      prepareWorkEvidence(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], "hasil.png", {
          type: "image/png",
        }),
      ),
    ).rejects.toThrow("WORK_EVIDENCE_TOO_LARGE");
  });
});
