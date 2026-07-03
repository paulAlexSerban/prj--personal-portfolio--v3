import { describe, it, expect } from "vitest";
import { pinActiveCardInQueue } from "./sessionQueue";
import { createCardState, type CardState } from "../store/types";

function card(slug: string): CardState {
  return createCardState(slug, "post");
}

describe("pinActiveCardInQueue", () => {
  it("returns the queue unchanged when there is no active slug", () => {
    const queue = [card("a"), card("b")];
    expect(pinActiveCardInQueue(queue, null)).toEqual(queue);
  });

  it("returns the queue unchanged when the active card is already first", () => {
    const queue = [card("a"), card("b"), card("c")];
    expect(pinActiveCardInQueue(queue, "a")).toEqual(queue);
  });

  it("pins the active card and queues jumped-ahead cards next", () => {
    const queue = [card("b"), card("a"), card("c")];
    expect(pinActiveCardInQueue(queue, "a").map((c) => c.questionSlug)).toEqual(["a", "b", "c"]);
  });

  it("returns the queue unchanged when the active slug is not present", () => {
    const queue = [card("b"), card("c")];
    expect(pinActiveCardInQueue(queue, "a")).toEqual(queue);
  });
});
