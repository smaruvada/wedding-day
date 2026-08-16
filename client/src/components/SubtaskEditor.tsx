import { Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Task } from "../types";

export type EditableSubtask = {
  id?: number;
  title: string;
};

export function SubtaskEditor({
  task,
  onSave,
  compactAddButton = false,
  showDisplayDeleteButton = false,
  useCancelButtonForEdits = false,
}: {
  task: Task;
  onSave: (subtasks: EditableSubtask[]) => void;
  compactAddButton?: boolean;
  showDisplayDeleteButton?: boolean;
  useCancelButtonForEdits?: boolean;
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
    const savedSubtasks = next.filter((subtask) => subtask.title.trim());
    setSubtasks(savedSubtasks);
    onSave(savedSubtasks);
    setEditingIndex(null);
  };
  const hasUnsavedNewSubtask =
    editingIndex !== null && subtasks[editingIndex]?.id === undefined;
  const hasBlankNewSubtask =
    hasUnsavedNewSubtask && !subtasks[editingIndex]?.title.trim();
  const cancelEdit = (index: number) => {
    const subtask = subtasks[index];
    if (subtask.id === undefined) {
      setSubtasks((current) =>
        current.filter((_, subtaskIndex) => subtaskIndex !== index),
      );
    } else {
      const originalTitle = task.subtasks.find(
        (taskSubtask) => taskSubtask.id === subtask.id,
      )?.title;
      if (originalTitle !== undefined) change(index, originalTitle);
    }
    setEditingIndex(null);
  };
  return (
    <Stack mt={compactAddButton ? "xs" : "md"}>
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
            <Button
              color={useCancelButtonForEdits ? undefined : "rose"}
              variant={useCancelButtonForEdits ? "light" : "subtle"}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() =>
                useCancelButtonForEdits
                  ? cancelEdit(index)
                  : save(subtasks.filter((_, subtaskIndex) => subtaskIndex !== index))
              }
              aria-label={`${useCancelButtonForEdits ? "Cancel editing" : "Delete"} subtask ${index + 1}`}
              title={useCancelButtonForEdits ? "Cancel" : "Delete subtask"}
            >
              {useCancelButtonForEdits ? "×" : <IconTrash size={16} stroke={1.8} />}
            </Button>
          </Group>
        ) : (
          <Group key={subtask.id ?? `new-${index}`} gap="xs">
            <Text
              className="subtask-display"
              onClick={() => {
                if (hasBlankNewSubtask && editingIndex !== null) {
                  setSubtasks((current) =>
                    current.filter((_, subtaskIndex) => subtaskIndex !== editingIndex),
                  );
                  setEditingIndex(
                    editingIndex < index ? index - 1 : index,
                  );
                  return;
                }
                setEditingIndex(index);
              }}
            >
              {subtask.title}
            </Text>
            {showDisplayDeleteButton && (
              <Button
                color="rose"
                variant="subtle"
                size="compact-xs"
                onClick={() =>
                  save(
                    subtasks.filter(
                      (_, subtaskIndex) => subtaskIndex !== index,
                    ),
                  )
                }
                aria-label={`Delete subtask ${index + 1}`}
                title="Delete subtask"
              >
                <IconTrash size={16} stroke={1.8} />
              </Button>
            )}
          </Group>
        ),
      )}
      <Button
        variant="light"
        size={compactAddButton ? "xs" : undefined}
        fw={compactAddButton ? 700 : undefined}
        className={compactAddButton ? "subtask-add-button" : undefined}
        style={compactAddButton ? { alignSelf: "flex-start" } : undefined}
        onClick={() => {
          if (hasUnsavedNewSubtask) return;
          setSubtasks((current) => [...current, { title: "" }]);
          setEditingIndex(subtasks.length);
        }}
        disabled={hasUnsavedNewSubtask}
        aria-label="Add subtask"
        title="Add subtask"
      >
        {compactAddButton ? "+" : "Add subtask"}
      </Button>
    </Stack>
  );
}
