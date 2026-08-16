export function calculateTaskStatus(
  subtasks: {
    completedAt: Date | null;
  }[],
  photoRequired: boolean,
  photoCount: number,
  completionConfirmed = false,
) {
  const workCompleted = subtasks.length
    ? subtasks.every((subtask) => subtask.completedAt)
    : completionConfirmed;
  return workCompleted &&
    (!photoRequired || photoCount > 0)
    ? "completed"
    : "open";
}
