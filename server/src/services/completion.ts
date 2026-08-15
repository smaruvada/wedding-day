export function calculateTaskStatus(
  subtasks: {
    completedAt: Date | null;
  }[],
  photoRequired: boolean,
  photoCount: number,
) {
  return subtasks.length > 0 &&
    subtasks.every((subtask) => subtask.completedAt) &&
    (!photoRequired || photoCount > 0)
    ? "completed"
    : "open";
}
