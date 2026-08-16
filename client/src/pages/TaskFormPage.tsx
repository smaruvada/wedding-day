import { Button, Checkbox, Group, Select, Stack, Text, TextInput, Textarea, Title } from "@mantine/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { taskApi } from "../api";
import { ErrorBox, Loading } from "../components/feedback";
import { Layout } from "../components/Layout";
import { EditableSubtask, SubtaskEditor } from "../components/SubtaskEditor";
import { Task } from "../types";

export function TaskFormPage({ edit = false }: { edit?: boolean }) {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const members = useQuery({
    queryKey: ["members"],
    queryFn: taskApi.members,
  });
  const detail = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => taskApi.get(taskId!),
    enabled: edit,
  });
  const [subtasks, setSubtasks] = useState<EditableSubtask[]>([]);
  useEffect(() => {
    if (edit && detail.data)
      setSubtasks(
        detail.data.task.subtasks.map(({ id, title }) => ({ id, title })),
      );
  }, [detail.data, edit]);
  const mutation = useMutation({
    mutationFn: async (payload: {
      assignedToUserId: number;
      [key: string]: unknown;
    }) => {
      if (!edit) return taskApi.create(payload);

      const { assignedToUserId, ...changes } = payload;
      const updated = await taskApi.update(Number(taskId), changes);
      return assignedToUserId === task?.assignedToUserId
        ? updated
        : taskApi.redelegate(Number(taskId), assignedToUserId);
    },
    onSuccess: ({ task }) =>
      navigate(edit ? `/tasks/${task.id}` : "/host/tasks"),
  });
  if (edit && detail.isLoading)
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  const task = detail.data?.task;
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
    mutation.mutate(
      edit
        ? { ...base, assignedToUserId }
        : {
            ...base,
            assignedToUserId,
            subtasks: taskSubtasks.map(({ title }) => ({ title })),
          },
    );
  };
  return (
    <Layout>
      <Title mb="lg">{edit ? "Edit task" : "Create task"}</Title>
      <form onSubmit={submit}>
        <Stack>
          <TextInput
            name="title"
            required
            label="Title"
            defaultValue={task?.title}
          />
          <Textarea
            name="description"
            label="Description"
            defaultValue={task?.description ?? ""}
          />
          <Select
            name="urgency"
            label="Urgency"
            defaultValue={task?.urgency ?? "low"}
            data={["low", "medium", "high", "urgent"]}
          />
          <Select
            required
            name="assignedToUserId"
            label="Assign to"
            defaultValue={
              task?.assignedToUserId ? String(task.assignedToUserId) : undefined
            }
            data={(members.data?.users ?? []).map((member) => ({
              value: String(member.id),
              label: member.name,
            }))}
          />
          <Checkbox
            name="photoRequired"
            label="Require completion photo"
            defaultChecked={task?.photoRequired}
          />
          <Text fw={600}>Items</Text>
          <SubtaskEditor
            task={{ ...task, subtasks } as Task}
            onSave={(updated) => setSubtasks(updated)}
          />
          {mutation.error && <ErrorBox error={mutation.error} />}
          <Group>
            <Button
              type="submit"
              loading={mutation.isPending}
              aria-label={edit ? "Save changes" : "Create task"}
              title={edit ? "Save changes" : "Create task"}
            >
              {edit ? "Save changes" : "Save"}
            </Button>
            <Button
              type="button"
              variant="light"
              onClick={() =>
                navigate(edit ? `/tasks/${taskId}` : "/host/tasks")
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
