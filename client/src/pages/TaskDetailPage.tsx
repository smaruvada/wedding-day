import { Alert, Badge, Button, Card, Checkbox, Group, Modal, Stack, Text, Textarea, Title } from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { questionApi, taskApi } from "../api";
import { ErrorBox, Loading } from "../components/feedback";
import { Layout } from "../components/Layout";
import { MemberQuestionEditModal, RelatedQuestionMemberActions } from "../components/MemberQuestionActions";
import { urgencyColors } from "../components/QuestionUrgencyBadge";
import { QuestionPhotos, TaskPhotos } from "../components/photos";
import { EditableSubtask, SubtaskEditor } from "../components/SubtaskEditor";
import { useAuthStore } from "../store";

export function TaskDetailPage() {
  const { taskId = "" } = useParams();
  const user = useAuthStore((state) => state.user)!;
  const client = useQueryClient();
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(
    null,
  );
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(
    null,
  );
  const [answerText, setAnswerText] = useState("");
  const query = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => taskApi.get(taskId),
  });
  const complete = useMutation({
    mutationFn: (subtaskId: number) =>
      taskApi.complete(Number(taskId), subtaskId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["task", taskId] });
      client.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
  const subtaskMutation = useMutation({
    mutationFn: (subtasks: EditableSubtask[]) =>
      taskApi.update(Number(taskId), { subtasks }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["task", taskId] });
      client.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
  const resolveQuestion = useMutation({
    mutationFn: ({ id, answer }: { id: number; answer: string }) =>
      questionApi.updateStatus(id, { status: "resolved", answerText: answer }),
    onSuccess: () => {
      setSelectedQuestionId(null);
      client.invalidateQueries({ queryKey: ["task", taskId] });
      client.invalidateQueries({ queryKey: ["questions"] });
    },
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
  const task = query.data!.task;
  const taskListPath = user.role === "host" ? "/host/tasks" : "/me/tasks";
  const selectedQuestion = task.relatedQuestions?.find(
    (question) => question.id === selectedQuestionId,
  );
  const editingQuestion = task.relatedQuestions?.find(
    (question) => question.id === editingQuestionId,
  );
  const openQuestion = (question: {
    id: number;
    answerText: string | null;
  }) => {
    setSelectedQuestionId(question.id);
    setAnswerText(question.answerText ?? "");
  };
  const itemsSection =
    user.role === "host" ? (
      <Card withBorder mt="xl">
        <Title order={3}>Items</Title>
        <SubtaskEditor
          task={task}
          onSave={(subtasks) => subtaskMutation.mutate(subtasks)}
          onToggle={(subtaskId) => complete.mutate(subtaskId)}
        />
        {subtaskMutation.error && <ErrorBox error={subtaskMutation.error} />}
      </Card>
    ) : (
      <Stack mt="lg">
        {task.subtasks.map((subtask) => (
          <Checkbox
            key={subtask.id}
            label={subtask.title}
            checked={!!subtask.completedAt}
            disabled={complete.isPending}
            onChange={() => complete.mutate(subtask.id)}
          />
        ))}
      </Stack>
    );
  const questionsSection = task.relatedQuestions?.length ? (
    <Card withBorder mt="xl">
      <Group justify="space-between">
        <Title order={3}>Questions</Title>
        <Badge color="rose" variant="light">
          {task.relatedQuestions.length}
        </Badge>
      </Group>
      <Stack mt="md">
        {task.relatedQuestions.map((question) => (
          <Group
            key={question.id}
            justify="space-between"
            className="related-question-row"
            role="button"
            tabIndex={0}
            onClick={() =>
              user.role === "host"
                ? openQuestion(question)
                : setEditingQuestionId(question.id)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                user.role === "host"
                  ? openQuestion(question)
                  : setEditingQuestionId(question.id);
              }
            }}
          >
            <div>
              <Text fw={600}>{question.content}</Text>
              <Group gap="xs" mt={4}>
                <Badge color={urgencyColors[question.urgency]}>
                  {question.urgency}
                </Badge>
                <Badge color={question.status === "resolved" ? "green" : "gray"}>
                  {question.status}
                </Badge>
              </Group>
            </div>
            {user.role === "member" && (
              <RelatedQuestionMemberActions
                question={question}
                taskId={taskId}
              />
            )}
          </Group>
        ))}
      </Stack>
    </Card>
  ) : null;
  const photosSection = <TaskPhotos task={task} user={user} />;
  return (
    <Layout>
      <Group justify="space-between" wrap="nowrap" className="task-detail-header">
        <Group gap="xs" wrap="nowrap" className="task-detail-heading">
          <Button
            component={Link}
            to={taskListPath}
            variant="subtle"
            aria-label="Back to tasks"
            title="Back to tasks"
          >
            ←
          </Button>
          <Title>{task.title}</Title>
        </Group>
        {user.role === "host" && (
          <Button
            component={Link}
            to={`/host/tasks/${task.id}/edit`}
            aria-label="Edit task"
            title="Edit task"
          >
            ✎
          </Button>
        )}
      </Group>
      <Badge color={task.status === "completed" ? "green" : "gray"}>
        {task.status}
      </Badge>
      <Text c="dimmed" my="md">
        {task.description}
      </Text>
      {task.openQuestionCount ? (
        <>
          {questionsSection}
          {itemsSection}
          {photosSection}
        </>
      ) : (
        <>
          {itemsSection}
          {photosSection}
          {questionsSection}
        </>
      )}
      <Modal
        opened={!!selectedQuestion}
        onClose={() => setSelectedQuestionId(null)}
        title="Related question"
      >
        <Stack>
          {selectedQuestion && (
            <>
              <Text fw={600}>{selectedQuestion.content}</Text>
              <Group gap="xs">
                <Badge color={urgencyColors[selectedQuestion.urgency]}>
                  {selectedQuestion.urgency}
                </Badge>
                <Badge
                  color={selectedQuestion.status === "resolved" ? "green" : "gray"}
                >
                  {selectedQuestion.status}
                </Badge>
              </Group>
              {selectedQuestion.answerText && (
                <Alert color="blue">{selectedQuestion.answerText}</Alert>
              )}
              <QuestionPhotos photos={selectedQuestion.photos} />
              <Textarea
                value={answerText}
                onChange={(event) => setAnswerText(event.currentTarget.value)}
                placeholder="Write an answer"
              />
              <Group justify="flex-end">
                <Button
                  variant="light"
                  onClick={() => setSelectedQuestionId(null)}
                >
                  Cancel
                </Button>
                {selectedQuestion.status === "resolved" ? (
                  <Button
                    onClick={() =>
                      void questionApi
                        .updateStatus(selectedQuestion.id, { status: "open" })
                        .then(() => {
                          setSelectedQuestionId(null);
                          client.invalidateQueries({
                            queryKey: ["task", taskId],
                          });
                          client.invalidateQueries({ queryKey: ["questions"] });
                        })
                    }
                  >
                    Unresolve
                  </Button>
                ) : (
                  <Button
                    onClick={() =>
                      resolveQuestion.mutate({
                        id: selectedQuestion.id,
                        answer: answerText,
                      })
                    }
                    loading={resolveQuestion.isPending}
                    disabled={!answerText.trim()}
                  >
                    Answer
                  </Button>
                )}
              </Group>
            </>
          )}
        </Stack>
      </Modal>
      {editingQuestion && (
        <MemberQuestionEditModal
          question={editingQuestion}
          taskId={taskId}
          opened
          onClose={() => setEditingQuestionId(null)}
        />
      )}
    </Layout>
  );
}
