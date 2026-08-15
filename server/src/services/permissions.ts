import { AuthUser } from "../types.js";
export const canRedelegate = (user: AuthUser) => user.role === "host";
export const canCompleteSubtask = (user: AuthUser, assignedToUserId: number) =>
  user.role === "member" && user.id === assignedToUserId;
export const canSetTaskUrgency = (user: AuthUser) => user.role === "host";
export const canOverrideQuestionUrgency = (user: AuthUser) =>
  user.role === "host";
