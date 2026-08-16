import { Button, Checkbox, Group, Stack, Text, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { taskApi } from "../api";
import { Task } from "../types";

export type EditableSubtask = {
  id?: number;
  title: string;
};

export function SubtaskEditor({
  task,
  onSave,
  onToggle,
}: {
  task: Task;
  onSave: (subtasks: EditableSubtask[]) => void;
  onToggle?: (subtaskId: number) => void;
}) {
  const [subtasks, setSubtasks] = useState<EditableSubtask[]>(
    task.subtasks.map(({ id, title }) => ({ id, title })),
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    setSubtasks(task.subtasks.map(({ id, title }) => ({ id, title })));
    setEditingIndex(null);
  }, [task.subtasks]);

  const change = (index: number, title: string) =>
    setSubtasks((current) =>
      current.map((subtask, subtaskIndex) =>
        subtaskIndex === index ? { ...subtask, title } : subtask,
      ),
    );
  const save = (next: EditableSubtask[]) => {
    setSubtasks(next);
    onSave(next);
    setEditingIndex(null);
  };
  const toggle = (subtaskId: number) => {
    if (onToggle) return onToggle(subtaskId);
    void taskApi.complete(task.id, subtaskId).then(() => window.location.reload());
  };

  return (
    <Stack mt="md">
      {subtasks.map((subtask, index) =>
        editingIndex === index ? (
          <Group key={subtask.id ?? `new-${index}`} align="end" wrap="nowrap">
            <TextInput
              className="subtask-input"
              value={subtask.title}
              onChange={(event) => change(index, event.currentTarget.value)}
              onBlur={() => subtask.title.trim() && save(subtasks)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (subtask.title.trim()) save(subtasks);
                }
              }}
              autoFocus
              aria-label={`Subtask ${index + 1}`}
            />
            <Button variant="light" onClick={() => subtask.title.trim() && save(subtasks)} disabled={!subtask.title.trim()} aria-label={`Save subtask ${index + 1}`} title="Save subtask">✓</Button>
            <Button color="red" variant="subtle" onMouseDown={(event) => event.preventDefault()} onClick={() => save(subtasks.filter((_, subtaskIndex) => subtaskIndex !== index))} aria-label={`Delete subtask ${index + 1}`} title="Delete subtask">×</Button>
          </Group>
        ) : (
          <Group key={subtask.id ?? `new-${index}`} gap="xs">
            {task.id && <Checkbox checked={!!task.subtasks[index]?.completedAt} onChange={() => subtask.id && toggle(subtask.id)} />}
            <Text className="subtask-display" onClick={() => setEditingIndex(index)}>{subtask.title}</Text>
          </Group>
        ),
      )}
      <Button variant="light" onClick={() => {
        setSubtasks((current) => [...current, { title: "" }]);
        setEditingIndex(subtasks.length);
      }}>
        Add subtask
      </Button>
    </Stack>
  );
}
