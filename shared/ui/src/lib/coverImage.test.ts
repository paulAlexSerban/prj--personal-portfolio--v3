import { describe, it, expect } from "vitest";
import { ASSET_BASE_URL, coverImageUrl } from "./coverImage";

const PLACEHOLDER = "/placeholder-cover.png";

describe("coverImageUrl", () => {
  it("returns the placeholder for null", () => {
    expect(coverImageUrl(null, PLACEHOLDER)).toBe(PLACEHOLDER);
  });

  it("returns the placeholder for undefined", () => {
    expect(coverImageUrl(undefined, PLACEHOLDER)).toBe(PLACEHOLDER);
  });

  it("returns the placeholder for empty / whitespace", () => {
    expect(coverImageUrl("", PLACEHOLDER)).toBe(PLACEHOLDER);
    expect(coverImageUrl("   ", PLACEHOLDER)).toBe(PLACEHOLDER);
  });

  it("passes through an absolute http(s) URL", () => {
    expect(coverImageUrl("https://cdn.example.com/x.png", PLACEHOLDER)).toBe(
      "https://cdn.example.com/x.png",
    );
  });

  it("passes through a root-absolute local path", () => {
    expect(coverImageUrl("/local.png", PLACEHOLDER)).toBe("/local.png");
  });

  it("prefixes a relative path with the asset base", () => {
    expect(coverImageUrl("covers/my-post.png", PLACEHOLDER)).toBe(
      `${ASSET_BASE_URL}/covers/my-post.png`,
    );
  });

  it("does not double the leading slash when prefixing", () => {
    expect(coverImageUrl("covers/x.png", PLACEHOLDER)).toBe(
      `${ASSET_BASE_URL}/covers/x.png`,
    );
  });
});
