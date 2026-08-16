import { Alert, Badge, Button, Card, Checkbox, Group, Modal, Select, Stack, Text, Textarea, Title } from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user)!;
  const viewMode = useAuthStore((state) => state.viewMode);
  const isHost = user.role !== "member" && viewMode === "host";
  const client = useQueryClient();
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(
    null,
  );
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(
    null,
  );
  const [answerText, setAnswerText] = useState("");
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const query = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => taskApi.get(taskId),
  });
  const members = useQuery({
    queryKey: ["members"],
    queryFn: taskApi.members,
    enabled: isHost,
  });
  const complete = useMutation({
    mutationFn: (subtaskId: number) =>
      taskApi.complete(Number(taskId), subtaskId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["task", taskId] });
      client.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
  const completeTask = useMutation({
    mutationFn: () => taskApi.completeTask(Number(taskId)),
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
  const assignmentMutation = useMutation({
    mutationFn: (assignedToUserId: number) =>
      taskApi.redelegate(Number(taskId), assignedToUserId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["task", taskId] });
      client.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: () => taskApi.remove(Number(taskId)),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["tasks"] });
      navigate("/host/tasks");
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
  const taskListPath = isHost ? "/host/tasks" : "/me/tasks";
  const selectedQuestion = task.relatedQuestions?.find(
    (question) => question.id === selectedQuestionId,
  );
  const editingQuestion = task.relatedQuestions?.find(
    (question) => question.id === editingQuestionId,
  );
  const memberCompletionControl = !isHost && (
    <Checkbox
      // label="Completed"
      checked={task.status === "completed"}
      disabled={
        task.subtasks.length > 0 ||
        completeTask.isPending ||
        (task.photoRequired && !task.photos.length)
      }
      onChange={() => completeTask.mutate()}
    />
  );
  const openQuestion = (question: {
    id: number;
    answerText: string | null;
  }) => {
    setSelectedQuestionId(question.id);
    setAnswerText(question.answerText ?? "");
  };
  const itemsSection =
    isHost ? (
      <Card withBorder mt="xl">
        <Title order={3}>Items</Title>
        <SubtaskEditor
          task={task}
          onSave={(subtasks) => subtaskMutation.mutate(subtasks)}
        />
        {subtaskMutation.error && <ErrorBox error={subtaskMutation.error} />}
      </Card>
    ) : (
      <>
        {task.subtasks.length > 0 && (
          <Card withBorder>
            <Title order={3}>Items</Title>
            <Stack mt="md">
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
          </Card>
        )}
      </>
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
              isHost
                ? openQuestion(question)
                : setEditingQuestionId(question.id)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                isHost
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
            {!isHost && (
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
        {isHost && (
          <Group gap="xs" wrap="nowrap">
            <Button
              color="light"
              onClick={() => setDeleteConfirmationOpen(true)}
              aria-label="Delete task"
              title="Delete task"
            >
              🗑
            </Button>
            <Button
              component={Link}
              to={`/host/tasks/${task.id}/edit`}
              aria-label="Edit task"
              title="Edit task"
            >
              ✎
            </Button>
          </Group>
        )}
      </Group>
      <Group justify="space-between" mt="sm">
        <Badge color={task.status === "completed" ? "green" : "gray"}>
          {task.status}
        </Badge>
        {memberCompletionControl}
      </Group>
      {isHost && (
        <Select
          w={180}
          mt="sm"
          // label="Assign to"
          placeholder="Choose a member"
          value={task.assignedToUserId ? String(task.assignedToUserId) : null}
          data={(members.data?.users ?? []).map((member) => ({
            value: String(member.id),
            label: member.name,
          }))}
          disabled={assignmentMutation.isPending}
          onChange={(value) => {
            if (value) assignmentMutation.mutate(Number(value));
          }}
        />
      )}
      {!isHost && !task.subtasks.length && task.photoRequired && !task.photos.length && (
        <Text size="sm" c="dimmed" mt="xs">Upload the required completion photo before marking this task complete.</Text>
      )}
      {assignmentMutation.error && <ErrorBox error={assignmentMutation.error} />}
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
        opened={deleteConfirmationOpen}
        onClose={() => setDeleteConfirmationOpen(false)}
        title="Delete task?"
      >
        <Stack>
          <Text>This permanently deletes the task and its completion photos.</Text>
          {deleteMutation.error && <ErrorBox error={deleteMutation.error} />}
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setDeleteConfirmationOpen(false)}>
              Cancel
            </Button>
            <Button color="red" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              Delete task
            </Button>
          </Group>
        </Stack>
      </Modal>
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
