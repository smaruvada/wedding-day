import { describe, expect, it } from "vitest";
import { calculateTaskStatus } from "./completion.js";
describe("task completion logic", () => {
  it("does not complete until every subtask is completed", () =>
    expect(
      calculateTaskStatus(
        [{ completedAt: new Date() }, { completedAt: null }],
        false,
        0,
      ),
    ).toBe("open"));
  it("completes after the final subtask", () =>
    expect(
      calculateTaskStatus(
        [{ completedAt: new Date() }, { completedAt: new Date() }],
        false,
        0,
      ),
    ).toBe("completed"));
  it("requires photo proof when configured", () =>
    expect(calculateTaskStatus([{ completedAt: new Date() }], true, 0)).toBe(
      "open",
    ));
  it("allows a task without items to be completed explicitly", () =>
    expect(calculateTaskStatus([], false, 0, true)).toBe("completed"));
  it("still requires photo proof for a confirmed no-item task", () =>
    expect(calculateTaskStatus([], true, 0, true)).toBe("open"));
});
