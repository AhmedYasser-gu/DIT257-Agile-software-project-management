import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { processImageToWebP } from "./image";

describe("image helpers", () => {
  const origCreate = URL.createObjectURL;
  const origRevoke = URL.revokeObjectURL;
  const origImage = (global as any).Image;
  const origCreateElement = document.createElement;

  beforeEach(() => {
    // Blob URL mocks
    URL.createObjectURL = vi.fn().mockReturnValue("blob:mock");
    URL.revokeObjectURL = vi.fn();

    // Mock <canvas>
    // getContext + toBlob + drawImage
    vi.spyOn(document, "createElement").mockImplementation(((tag: string) => {
      if (tag === "canvas") {
        const node: any = {
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue({
            drawImage: vi.fn(),
          }),
          toBlob: (cb: (b: Blob | null) => void, type: string, quality?: number) =>
            cb(new Blob(["x"], { type: "image/webp" })),
        };
        return node;
      }
      return origCreateElement.call(document, tag);
    }) as any);

    // Mock Image – triggers onload async, with desired natural size
    class MockImage {
      onload: null | (() => void) = null;
      onerror: any = null;
      src = "";
      naturalWidth = 2560;  // > MAX_EDGE to exercise downscale
      naturalHeight = 1440;

      set srcSetter(v: string) {
        this.src = v;
      }
    }
    Object.defineProperty(MockImage.prototype, "src", {
      set(this: any, v: string) {
        this._src = v;
        // Simulate async load
        queueMicrotask(() => this.onload && this.onload());
      },
      get(this: any) {
        return this._src;
      },
    });
    // @ts-expect-error
    (global as any).Image = MockImage;
  });

  afterEach(() => {
    URL.createObjectURL = origCreate;
    URL.revokeObjectURL = origRevoke;
    // @ts-expect-error
    (global as any).Image = origImage;
    (document.createElement as any).mockRestore?.();
    vi.restoreAllMocks();
  });

  it("downscales, strips metadata (via canvas), returns WebP blob + dims", async () => {
    // File mock
    const file = new File([new Uint8Array([1, 2, 3])], "photo.jpg", { type: "image/jpeg" });
    const res = await processImageToWebP(file);

    // Input was 2560x1440, MAX_EDGE=1280 → scale 0.5 -> 1280x720
    expect(res.width).toBe(1280);
    expect(res.height).toBe(720);
    expect(res.blob).toBeInstanceOf(Blob);
    expect(res.blob.type).toBe("image/webp");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });
});
