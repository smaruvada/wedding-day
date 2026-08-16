import { Button, Card, Checkbox, Group, Select, Stack, TextInput, Textarea, Title } from "@mantine/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { taskApi } from "../api";
import { ErrorBox } from "../components/feedback";
import { Layout } from "../components/Layout";
import { EditableSubtask, SubtaskEditor } from "../components/SubtaskEditor";
import { Task } from "../types";

export function TaskFormPage() {
  const navigate = useNavigate();
  const members = useQuery({
    queryKey: ["members"],
    queryFn: taskApi.members,
  });
  const [subtasks, setSubtasks] = useState<EditableSubtask[]>([]);
  const mutation = useMutation({
    mutationFn: taskApi.create,
    onSuccess: () => navigate("/host/tasks"),
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const description = String(form.get("description") ?? "").trim();
    const assignedToUserId = Number(form.get("assignedToUserId"));
    const taskSubtasks = subtasks
      .map(({ id, title }) => ({ id, title: title.trim() }))
      .filter((subtask) => subtask.title);
    const base = {
      title: form.get("title"),
      urgency: form.get("urgency"),
      photoRequired: form.get("photoRequired") === "on",
      subtasks: taskSubtasks,
      ...(description && { description }),
    };
    mutation.mutate({
      ...base,
      assignedToUserId,
      subtasks: taskSubtasks.map(({ title }) => ({ title })),
    });
  };
  return (
    <Layout>
      <Title mb="lg">Create task</Title>
      <form onSubmit={submit}>
        <Stack>
          <TextInput
            name="title"
            required
            label="Title"
          />
          <Textarea
            name="description"
            label="Description"
          />
          <Select
            name="urgency"
            label="Urgency"
            defaultValue="low"
            data={["low", "medium", "high", "urgent"]}
          />
          <Select
            required
            name="assignedToUserId"
            label="Assign to"
            data={(members.data?.users ?? []).map((member) => ({
              value: String(member.id),
              label: member.name,
            }))}
          />
          <Checkbox
            name="photoRequired"
            label="Require completion photo"
          />
          <Card withBorder>
            <Title order={3}>Items</Title>
            <SubtaskEditor
              task={{ subtasks } as Task}
              onSave={(updated) => setSubtasks(updated)}
              showDisplayDeleteButton
              useCancelButtonForEdits
            />
          </Card>
          {mutation.error && <ErrorBox error={mutation.error} />}
          <Group>
            <Button
              type="submit"
              loading={mutation.isPending}
              aria-label="Create task"
              title="Create task"
            >
              Save
            </Button>
            <Button
              type="button"
              variant="light"
              onClick={() =>
                navigate("/host/tasks")
              }
            >
              Cancel
            </Button>
          </Group>
        </Stack>
      </form>
    </Layout>
  );
}
