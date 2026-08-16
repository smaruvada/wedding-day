import { Alert, Badge, Button, Card, FileButton, Group, Modal, Select, SimpleGrid, Stack, Text, Textarea, Title } from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { questionApi, taskApi } from "../api";
import { EmptyState, ErrorBox, Loading } from "../components/feedback";
import { Layout } from "../components/Layout";
import { QuestionUrgencyBadge, urgencyColors } from "../components/QuestionUrgencyBadge";
import { QuestionPhotos } from "../components/photos";
import { useAuthStore } from "../store";
import { Question } from "../types";

export function QuestionCard({
  question,
  isHost,
  onStatusChange,
  onUrgencyChange,
  onDelete,
  onEdit,
}: {
  question: Question;
  isHost: boolean;
  onStatusChange: (id: number, status: string, answerText?: string) => void;
  onUrgencyChange: (id: number, urgency: string) => void;
  onDelete?: () => void;
  onEdit?: (content: string) => void;
}) {
  const [showTask, setShowTask] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(question.content);
  const [answerText, setAnswerText] = useState(question.answerText ?? "");
  const relatedTask = useQuery({
    queryKey: ["task", question.taskId],
    queryFn: () => taskApi.get(String(question.taskId)),
    enabled: showTask && question.taskId !== null,
  });

  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} className="question-context">
      <Card
        withBorder
        id={`question-${question.id}`}
        role={onEdit ? "button" : undefined}
        tabIndex={onEdit ? 0 : undefined}
        onClick={() => onEdit && setEditing(true)}
        onKeyDown={(event) => {
          if (onEdit && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            setEditing(true);
          }
        }}
      >
        <Group justify="space-between">
          <Text fw={600}>{question.content}</Text>
          <Group>
            <QuestionUrgencyBadge question={question} isHost={isHost} onChange={(urgency) => onUrgencyChange(question.id, urgency)} />
            {onDelete && <Button color="red" variant="subtle" size="xs" onClick={(event) => { event.stopPropagation(); onDelete(); }}>×</Button>}
          </Group>
        </Group>
        {question.answerText && <Alert mt="sm" color="blue">{question.answerText}</Alert>}
        <QuestionPhotos photos={question.photos} />
        {isHost && <Stack mt="md"><Textarea value={answerText} onChange={(event) => setAnswerText(event.currentTarget.value)} placeholder="Write an answer" /><Button onClick={() => onStatusChange(question.id, "resolved", answerText)} disabled={!answerText.trim()}>Answer</Button></Stack>}
        {question.taskId && <Group justify="center" mt="sm"><Button variant="subtle" size="xs" aria-label={showTask ? "Collapse related task" : "Expand related task"} onClick={(event) => { event.stopPropagation(); setShowTask((current) => !current); }}>{showTask ? "↑" : "↓"}</Button></Group>}
        <Modal opened={editing} onClose={() => setEditing(false)} onClick={(event) => event.stopPropagation()} title="Edit question"><Stack><Textarea value={content} onChange={(event) => setContent(event.currentTarget.value)} label="Question" /><Group justify="flex-end"><Button variant="light" onClick={() => setEditing(false)}>Cancel</Button><Button onClick={() => { if (content.trim()) { onEdit?.(content.trim()); setEditing(false); } }} disabled={!content.trim()}>Save</Button></Group></Stack></Modal>
        {showTask && relatedTask.data && <div className="related-task-panel"><Text fw={600}>{relatedTask.data.task.title}</Text><Text size="sm" c="dimmed">{relatedTask.data.task.description}</Text><Button component={Link} to={`/tasks/${question.taskId}`} variant="light" size="xs">Open full task</Button></div>}
        {showTask && relatedTask.isLoading && <Loading />}
        {showTask && relatedTask.error && <ErrorBox error={relatedTask.error} />}
      </Card>
    </SimpleGrid>
  );
}

export function QuestionsPage() {
  const user = useAuthStore((state) => state.user)!;
  const viewMode = useAuthStore((state) => state.viewMode);
  const isHost = user.role !== "member" && viewMode === "host";
  const isMemberView = !isHost;
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["questions"],
    queryFn: questionApi.list,
  });
  const tasks = useQuery({
    queryKey: ["tasks"],
    queryFn: taskApi.list,
    enabled: isMemberView,
  });
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const create = useMutation({
    mutationFn: (payload: object) => questionApi.create(payload),
    onSuccess: async ({ question }) => {
      if (photo) await questionApi.upload(question.id, photo);
      client.invalidateQueries({ queryKey: ["questions"] });
      setPhoto(null);
      setOpen(false);
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => questionApi.remove(id),
    onSuccess: () => client.invalidateQueries({ queryKey: ["questions"] }),
  });
  const edit = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      questionApi.update(id, { content }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["questions"] }),
  });
  const update = useMutation({
    mutationFn: ({ id, ...payload }: { id: number; [key: string]: unknown }) =>
      questionApi.updateStatus(id, payload),
    onSuccess: () => client.invalidateQueries({ queryKey: ["questions"] }),
  });
  const updateUrgency = useMutation({
    mutationFn: ({ id, urgency }: { id: number; urgency: string }) =>
      questionApi.updateUrgency(id, urgency),
    onSuccess: () => client.invalidateQueries({ queryKey: ["questions"] }),
  });
  if (query.isLoading)
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  if (query.error)
    return (
      <Layout>
        <ErrorBox error={query.error} />
      </Layout>
    );
  const questions = query.data?.questions ?? [];
  return (
    <Layout>
      <Group justify="space-between" mb="lg">
        <Title className="list-page-heading">{isHost ? "Questions" : "My Questions"}</Title>
        {isMemberView && (
          <Button onClick={() => setOpen(true)} disabled={!tasks.data?.tasks.length}>
            Ask host
          </Button>
        )}
      </Group>
      {questions.length ? (
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              isHost={isHost}
              onStatusChange={(id, status, answerText) =>
                update.mutate({ id, status, answerText })
              }
              onUrgencyChange={(id, urgency) =>
                updateUrgency.mutate({ id, urgency })
              }
              onEdit={
                isMemberView
                  ? (content) => edit.mutate({ id: question.id, content })
                  : undefined
              }
              onDelete={
                isMemberView
                  ? () => remove.mutate(question.id)
                  : undefined
              }
            />
          ))}
        </SimpleGrid>
      ) : (
        <EmptyState
          message={
            isHost ? "No questions yet." : "No questions yet."
          }
          description={isHost ? undefined : "If you're stuck, ask a question!"}
          action={
            isHost ? (
              <Button component={Link} to="/host/tasks/new">
                Create task
              </Button>
            ) : undefined
          }
        />
      )}
      <Modal opened={open} onClose={() => setOpen(false)} title="Ask the hosts">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            create.mutate({
              content: form.get("content"),
              taskId: Number(form.get("taskId")),
              urgency: form.get("urgency"),
            });
          }}
        >
          <Stack>
            <Textarea required name="content" label="Question" />
            <Select
              required
              name="taskId"
              label="Related task"
              data={(tasks.data?.tasks ?? []).map((task) => ({
                value: String(task.id),
                label: task.title,
              }))}
            />
            <Select
              name="urgency"
              label="Urgency"
              defaultValue="low"
              data={["low", "medium", "high", "urgent"]}
            />
            <FileButton onChange={setPhoto} accept="image/*">
              {(props) => (
                <Button {...props} variant="light">
                  Attach photo
                </Button>
              )}
            </FileButton>
            {photo && <Text size="sm">Attached: {photo.name}</Text>}
            <Button type="submit" loading={create.isPending}>
              Send question
            </Button>
          </Stack>
        </form>
      </Modal>
    </Layout>
  );
}
