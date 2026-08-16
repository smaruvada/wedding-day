import { describe, expect, it } from "vitest";
import {
  canCompleteSubtask,
  canOverrideQuestionUrgency,
  canRedelegate,
  canSetTaskUrgency,
} from "./permissions.js";
const host = {
  id: 1,
  email: "host@test",
  name: "Host",
  role: "host" as const,
  eventId: 1,
  roleType: "bride",
};
const member = {
  id: 2,
  email: "member@test",
  name: "Member",
  role: "member" as const,
  eventId: 1,
  roleType: null,
};
describe("permission enforcement", () => {
  it("denies member re-delegation and allows hosts", () => {
    expect(canRedelegate(member)).toBe(false);
    expect(canRedelegate(host)).toBe(true);
  });
  it("denies completion for tasks not assigned to the member", () => {
    expect(canCompleteSubtask(member, 3)).toBe(false);
    expect(canCompleteSubtask(member, 2)).toBe(true);
  });
  it("keeps task urgency host-controlled", () => {
    expect(canSetTaskUrgency(member)).toBe(false);
    expect(canSetTaskUrgency(host)).toBe(true);
  });
  it("allows only hosts to override question urgency", () => {
    expect(canOverrideQuestionUrgency(member)).toBe(false);
    expect(canOverrideQuestionUrgency(host)).toBe(true);
  });
});
