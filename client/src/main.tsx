import "@mantine/core/styles.css";
import "./wedding.css";
import {
  Alert,
  AppShell,
  Badge,
  Button,
  Card,
  Center,
  Checkbox,
  Container,
  FileButton,
  Group,
  Loader,
  MantineProvider,
  Menu,
  Modal,
  PasswordInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  createTheme,
} from "@mantine/core";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { createRoot } from "react-dom/client";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import { authApi, questionApi, taskApi } from "./api";
import { useAuthStore } from "./store";
import { Photo, Question, Subtask, Task, Urgency } from "./types";
const queryClient = new QueryClient();
const weddingTheme = createTheme({
  primaryColor: "rose",
  primaryShade: 6,
  defaultRadius: "md",
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  headings: {
    fontFamily: "Georgia, Times New Roman, serif",
    fontWeight: "600",
  },
  colors: {
    rose: [
      "#fff7f5",
      "#fceae6",
      "#f5d7d1",
      "#edc1b9",
      "#e7ada3",
      "#df978d",
      "#c87870",
      "#a85c57",
      "#87433f",
      "#6d3432",
    ],
    sage: [
      "#f3f7f1",
      "#e4ede1",
      "#ceddc9",
      "#b5cbb0",
      "#9cb99a",
      "#85a784",
      "#6a8b68",
      "#526e53",
      "#3d5740",
      "#2d4532",
    ],
  },
});
const urgencyColors: Record<Urgency, string> = {
  low: "sage",
  medium: "blue",
  high: "orange",
  urgent: "red",
};
type EditableSubtask = {
  id?: number;
  title: string;
};
const ErrorBox = ({ error }: { error: unknown }) => {
  const responseError = (
    error as {
      response?: {
        data?: {
          error?: unknown;
        };
      };
    }
  )?.response?.data?.error;
  return (
    <Alert color="red">
      {typeof responseError === "string"
        ? responseError
        : error instanceof Error
          ? error.message
          : "Unable to load data"}
    </Alert>
  );
};
const Loading = () => (
  <Center py="xl">
    <Loader />
  </Center>
);
const EmptyState = ({
  message,
  action,
}: {
  message: string;
  action: ReactNode;
}) => (
  <Card withBorder className="empty-state" role="status">
    <Stack align="center" gap="sm">
      <Text fw={600}>{message}</Text>
      <Text size="sm" c="dimmed" ta="center">
        Start here to keep the wedding day moving smoothly.
      </Text>
      {action}
    </Stack>
  </Card>
);
function QuestionUrgencyBadge({
  question,
  isHost,
  onChange,
}: {
  question: Question;
  isHost: boolean;
  onChange: (urgency: string) => void;
}) {
  if (!isHost)
    return (
      <Badge color={urgencyColors[question.urgency]}>{question.urgency}</Badge>
    );
  return (
    <Menu position="bottom-start">
      <Menu.Target>
        <button
          type="button"
          className="urgency-badge-button"
          aria-label={`Change urgency from ${question.urgency}`}
        >
          <Badge color={urgencyColors[question.urgency]}>
            {question.urgency}
          </Badge>
        </button>
      </Menu.Target>
      <Menu.Dropdown>
        {(["low", "medium", "high", "urgent"] as Urgency[]).map((urgency) => (
          <Menu.Item key={urgency} onClick={() => onChange(urgency)}>
            {urgency}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
function Layout({ children }: { children: ReactNode }) {
  const { user, clear } = useAuthStore();
  const questions = useQuery({
    queryKey: ["questions"],
    queryFn: questionApi.list,
    enabled: !!user,
  });
  if (!user) return <Navigate to="/login" replace />;
  const taskPath = user.role === "host" ? "/host/tasks" : "/me/tasks";
  const openQuestionCount = questions.data?.questions.length ?? 0;
  return (
    <AppShell header={{ height: { base: 112, sm: 62 } }} padding="md">
      <AppShell.Header>
        <Group
          h="100%"
          px="md"
          justify="space-between"
          className="app-header-content"
        >
          <Group className="app-primary-nav">
            <Link className="brand-link" to={taskPath}>
              <Title order={3}>Wedding Day</Title>
            </Link>
            <Button component={Link} to={taskPath} variant="subtle">
              Tasks
            </Button>
            <Button
              component={Link}
              to={user.role === "host" ? "/host/questions" : "/me/questions"}
              variant="subtle"
            >
              Questions&nbsp; <Badge size="sm" circle>{openQuestionCount}</Badge>
            </Button>
          </Group>
          <Menu position="bottom-end">
            <Menu.Target>
              <Button className="account-menu-button" variant="subtle">
                {user.name}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={clear}>Log out</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="lg">{children}</Container>
      </AppShell.Main>
    </AppShell>
  );
}
function AuthPage({ register = false }: { register?: boolean }) {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: (payload: object) =>
      register
        ? authApi.register(payload)
        : authApi.login(
            payload as {
              email: string;
              password: string;
            },
          ),
    onSuccess: ({ token, user }) => {
      setAuth(token, user);
      navigate(user.role === "host" ? "/host/tasks" : "/me/tasks");
    },
    onError: (requestError: any) =>
      setError(requestError.response?.data?.error ?? "Unable to authenticate"),
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate({
      email: form.get("email"),
      password: form.get("password"),
      name: form.get("name"),
      role: form.get("role") || "member",
      hostType: form.get("hostType") || undefined,
    });
  };
  return (
    <Container size={420} py={80}>
      <Stack>
        <Title>{register ? "Create your account" : "Welcome back"}</Title>
        {error && <Alert color="red">{error}</Alert>}
        <form onSubmit={submit}>
          <Stack>
            {register && (
              <>
                <TextInput required name="name" label="Name" />
                <Select
                  name="role"
                  label="Role"
                  defaultValue="member"
                  data={[
                    { value: "member", label: "Wedding party member" },
                    { value: "host", label: "Host" },
                  ]}
                />
                <Select
                  name="hostType"
                  label="Host type (if host)"
                  data={["bride", "maid_of_honor", "planner", "other"]}
                />
              </>
            )}
            <TextInput required name="email" type="email" label="Email" />
            <PasswordInput
              required
              name="password"
              label="Password"
              minLength={8}
            />
            <Button type="submit" loading={mutation.isPending}>
              {register ? "Register" : "Log in"}
            </Button>
          </Stack>
        </form>
        <Text size="sm">
          {register ? "Already registered?" : "Need an account?"}{" "}
          <Link to={register ? "/login" : "/register"}>
            {register ? "Log in" : "Register"}
          </Link>
        </Text>
      </Stack>
    </Container>
  );
}
function TaskCard({ task, host = false }: { task: Task; host?: boolean }) {
  return (
    <Card
      component={Link}
      to={`/tasks/${task.id}`}
      withBorder
      className="task-card-link"
    >
      <Group justify="space-between">
        <div>
          <Text fw={600}>{task.title}</Text>
          <Text size="sm" c="dimmed">
            {task.assignee?.name ??
              `${task.subtasks.filter((subtask) => subtask.completedAt).length}/${task.subtasks.length} steps completed`}
          </Text>
        </div>
        <Group>
          {host && !!task.openQuestionCount && (
            <Badge color="rose" variant="light">
              {task.openQuestionCount} open{" "}
              {task.openQuestionCount === 1 ? "question" : "questions"}
            </Badge>
          )}
          {task.status === "completed" ? (
            <Badge color="green">completed</Badge>
          ) : (
            <Badge color={urgencyColors[task.urgency]}>{task.urgency}</Badge>
          )}
        </Group>
      </Group>
    </Card>
  );
}
function TaskList({ host = false }: { host?: boolean }) {
  const query = useQuery({ queryKey: ["tasks"], queryFn: taskApi.list });
  const [status, setStatus] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorBox error={query.error} />;
  const tasks = (query.data?.tasks ?? []).filter(
    (task) =>
      (!status || task.status === status) &&
      (!urgency || task.urgency === urgency),
  );
  const createTaskButton = (
    <Button
      component={Link}
      to="/host/tasks/new"
      aria-label="Create task"
      title="Create task"
    >
      +
    </Button>
  );
  return (
    <Layout>
      <Group justify="space-between" mb="lg">
        <Title>{host ? "All Tasks" : "My Tasks"}</Title>
        {host && (
          <Group gap="xs">
            <Button
              variant="light"
              onClick={() => setFiltersOpen((current) => !current)}
              aria-expanded={filtersOpen}
            >
              Filters
            </Button>
            {createTaskButton}
          </Group>
        )}
      </Group>
      {host && filtersOpen && (
        <Group mb="md">
          <Select
            placeholder="Status"
            clearable
            data={["open", "completed"]}
            value={status}
            onChange={setStatus}
          />
          <Select
            placeholder="Urgency"
            clearable
            data={["low", "medium", "high", "urgent"]}
            value={urgency}
            onChange={setUrgency}
          />
        </Group>
      )}
      {tasks.length ? (
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} host={host} />
          ))}
        </SimpleGrid>
      ) : (
        <EmptyState
          message={host ? "No tasks yet." : "No tasks assigned yet."}
          action={
            host ? (
              createTaskButton
            ) : (
              <Button component={Link} to="/me/questions">
                Ask a question
              </Button>
            )
          }
        />
      )}
    </Layout>
  );
}
function SubtaskEditor({
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
    void taskApi
      .complete(task.id, subtaskId)
      .then(() => window.location.reload());
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
              autoFocus
              aria-label={`Subtask ${index + 1}`}
            />
            <Button
              variant="light"
              onClick={() => subtask.title.trim() && save(subtasks)}
              disabled={!subtask.title.trim()}
              aria-label={`Save subtask ${index + 1}`}
              title="Save subtask"
            >
              ✓
            </Button>
            <Button
              color="red"
              variant="subtle"
              onClick={() =>
                save(
                  subtasks.filter((_, subtaskIndex) => subtaskIndex !== index),
                )
              }
              disabled={subtasks.length === 1}
              aria-label={`Delete subtask ${index + 1}`}
              title="Delete subtask"
            >
              ×
            </Button>
          </Group>
        ) : (
          <Group key={subtask.id ?? `new-${index}`} gap="xs">
            {task.id && (
              <Checkbox
                checked={!!task.subtasks[index]?.completedAt}
                onChange={() => subtask.id && toggle(subtask.id)}
              />
            )}
            <Text
              className="subtask-display"
              onClick={() => setEditingIndex(index)}
            >
              {subtask.title}
            </Text>
          </Group>
        ),
      )}
      <Button
        variant="light"
        onClick={() => {
          setSubtasks((current) => [...current, { title: "" }]);
          setEditingIndex(subtasks.length);
        }}
      >
        Add subtask
      </Button>
    </Stack>
  );
}
function TaskPhotos({
  task,
  user,
}: {
  task: Task;
  user: {
    role: string;
  };
}) {
  const client = useQueryClient();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const upload = useMutation({
    mutationFn: (file: File) => taskApi.upload(task.id, file),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["task", String(task.id)] }),
  });
  const remove = useMutation({
    mutationFn: (photoId: number) => taskApi.removePhoto(task.id, photoId),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["task", String(task.id)] }),
  });
  return (
    <Card withBorder mt="xl">
      <Text fw={600}>Photos {task.photoRequired && "(required)"}</Text>
      {(upload.error || remove.error) && (
        <ErrorBox error={upload.error ?? remove.error} />
      )}
      <Group mt="md">
        {task.photos.map((photo) => (
          <div key={photo.id} className="task-photo">
            <button
              type="button"
              className="photo-preview-button"
              onClick={() => setSelectedPhoto(photo.filePath)}
            >
              <img src={photo.filePath} alt="Completion proof" />
            </button>
            <Button
              color="red"
              variant="subtle"
              size="xs"
              onClick={() => remove.mutate(photo.id)}
              loading={remove.isPending}
            >
              Delete
            </Button>
          </div>
        ))}
      </Group>
      {!task.photos.length && (
        <Text size="sm" c="dimmed" mt="sm">
          No completion photos uploaded.
        </Text>
      )}
      {user.role === "member" && (
        <FileButton
          onChange={(file) => file && upload.mutate(file)}
          accept="image/*"
        >
          {(props) => (
            <Button {...props} mt="sm" loading={upload.isPending}>
              Upload proof photo
            </Button>
          )}
        </FileButton>
      )}
      <Modal
        opened={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        title="Completion photo"
        size="lg"
      >
        <img
          className="expanded-photo"
          src={selectedPhoto ?? ""}
          alt="Expanded completion proof"
        />
      </Modal>
    </Card>
  );
}
function QuestionPhotos({ photos }: { photos: Photo[] }) {
  const client = useQueryClient();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const remove = useMutation({
    mutationFn: (photoId: number) => questionApi.removePhoto(photoId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["questions"] });
      client.invalidateQueries({ queryKey: ["task"] });
    },
  });
  if (!photos.length) return null;
  return (
    <>
      <div onClick={(event) => event.stopPropagation()}>
        <Group mt="sm">
          {photos.map((photo) => (
            <div key={photo.id} className="task-photo">
              <button
                type="button"
                className="photo-preview-button"
                onClick={() => setSelectedPhoto(photo.filePath)}
              >
                <img src={photo.filePath} alt="Question attachment" />
              </button>
              <Button
                color="red"
                variant="subtle"
                size="xs"
                onClick={() => remove.mutate(photo.id)}
                loading={remove.isPending}
              >
                Delete
              </Button>
            </div>
          ))}
        </Group>
        {remove.error && <ErrorBox error={remove.error} />}
      </div>
      <Modal
        opened={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        title="Question photo"
        size="lg"
      >
        <img
          className="expanded-photo"
          src={selectedPhoto ?? ""}
          alt="Expanded question attachment"
        />
      </Modal>
    </>
  );
}
function MemberQuestionEditModal({
  question,
  taskId,
  opened,
  onClose,
}: {
  question: {
    id: number;
    content: string;
  };
  taskId?: string;
  opened: boolean;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [content, setContent] = useState(question.content);
  useEffect(() => setContent(question.content), [question]);
  const refresh = () => {
    client.invalidateQueries({ queryKey: ["questions"] });
    if (taskId) client.invalidateQueries({ queryKey: ["task", taskId] });
  };
  const edit = useMutation({
    mutationFn: () => questionApi.update(question.id, { content }),
    onSuccess: () => {
      refresh();
      onClose();
    },
  });
  return (
    <Modal opened={opened} onClose={onClose} title="Edit question">
      <Stack>
        <Textarea
          value={content}
          onChange={(event) => setContent(event.currentTarget.value)}
          label="Question"
        />
        {edit.error && <ErrorBox error={edit.error} />}
        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => edit.mutate()}
            loading={edit.isPending}
            disabled={!content.trim()}
          >
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
function RelatedQuestionMemberActions({
  question,
  taskId,
}: {
  question: {
    id: number;
  };
  taskId: string;
}) {
  const client = useQueryClient();
  const remove = useMutation({
    mutationFn: () => questionApi.remove(question.id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["task", taskId] });
      client.invalidateQueries({ queryKey: ["questions"] });
    },
  });
  return (
    <Button
      color="red"
      variant="subtle"
      size="xs"
      onClick={(event) => {
        event.stopPropagation();
        remove.mutate();
      }}
      loading={remove.isPending}
      aria-label="Delete question"
      title="Delete question"
    >
      ×
    </Button>
  );
}
function TaskDetail() {
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
function TaskForm({ edit = false }: { edit?: boolean }) {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const members = useQuery({
    queryKey: ["members"],
    queryFn: taskApi.members,
    enabled: !edit,
  });
  const detail = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => taskApi.get(taskId!),
    enabled: edit,
  });
  const [subtasks, setSubtasks] = useState<EditableSubtask[]>([
    { title: "" },
    { title: "" },
  ]);
  useEffect(() => {
    if (edit && detail.data)
      setSubtasks(
        detail.data.task.subtasks.map(({ id, title }) => ({ id, title })),
      );
  }, [detail.data, edit]);
  const mutation = useMutation({
    mutationFn: (payload: object) =>
      edit ? taskApi.update(Number(taskId), payload) : taskApi.create(payload),
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
    const base = {
      title: form.get("title"),
      description: form.get("description") || null,
      urgency: form.get("urgency"),
      photoRequired: form.get("photoRequired") === "on",
      subtasks,
    };
    mutation.mutate(
      edit
        ? base
        : {
            ...base,
            assignedToUserId: Number(form.get("assignedToUserId")),
            subtasks: subtasks.map(({ title }) => ({ title })),
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
          {!edit && (
            <Select
              required
              name="assignedToUserId"
              label="Assign to"
              data={(members.data?.users ?? []).map((member) => ({
                value: String(member.id),
                label: member.name,
              }))}
            />
          )}
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
function QuestionCard({
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
  const closeEditor = () => {
    setContent(question.content);
    setEditing(false);
  };
  const openEditor = () => onEdit && setEditing(true);
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} className="question-context">
      <Card
        withBorder
        id={`question-${question.id}`}
        role={onEdit ? "button" : undefined}
        tabIndex={onEdit ? 0 : undefined}
        onClick={openEditor}
        onKeyDown={(event) => {
          if (onEdit && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            openEditor();
          }
        }}
      >
        <Group justify="space-between">
          <Text fw={600}>{question.content}</Text>
          <Group>
            <QuestionUrgencyBadge
              question={question}
              isHost={isHost}
              onChange={(urgency) => onUrgencyChange(question.id, urgency)}
            />
            <Button
              variant="subtle"
              size="xs"
              disabled={!question.taskId}
              onClick={(event) => {
                event.stopPropagation();
                setShowTask((current) => !current);
              }}
              aria-label={
                showTask ? "Collapse related task" : "Expand related task"
              }
              title={showTask ? "Collapse related task" : "Expand related task"}
            >
              {showTask ? "‹" : "›"}
            </Button>
            {onDelete && (
              <Button
                color="red"
                variant="subtle"
                size="xs"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
                aria-label="Delete question"
                title="Delete question"
              >
                ×
              </Button>
            )}
          </Group>
        </Group>
        {question.answerText && (
          <Alert mt="sm" color="blue">
            {question.answerText}
          </Alert>
        )}
        <QuestionPhotos photos={question.photos} />
        {isHost && (
          <Stack mt="md">
            <Textarea
              value={answerText}
              onChange={(event) => setAnswerText(event.currentTarget.value)}
              placeholder="Write an answer"
            />
            <Button
              onClick={() =>
                onStatusChange(question.id, "resolved", answerText)
              }
              disabled={!answerText.trim()}
            >
              Answer
            </Button>
          </Stack>
        )}
        <Modal
          opened={editing}
          onClose={closeEditor}
          onClick={(event) => event.stopPropagation()}
          title="Edit question"
        >
          <Stack>
            <Textarea
              value={content}
              onChange={(event) => setContent(event.currentTarget.value)}
              label="Question"
            />
            <Group justify="flex-end">
              <Button variant="light" onClick={closeEditor}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (content.trim()) {
                    onEdit?.(content.trim());
                    setEditing(false);
                  }
                }}
                disabled={!content.trim()}
              >
                Save
              </Button>
            </Group>
          </Stack>
        </Modal>
        {showTask && question.taskId !== null && (
          <div className="related-task-panel">
            <Title order={3}>Related task</Title>
            {relatedTask.isLoading && <Loading />}
            {relatedTask.error && <ErrorBox error={relatedTask.error} />}{" "}
            {relatedTask.data && (
              <Stack mt="md">
                <Text fw={600}>{relatedTask.data.task.title}</Text>
                <Text size="sm" c="dimmed">
                  {relatedTask.data.task.description}
                </Text>
                <Group gap="xs">
                  <Badge color={urgencyColors[relatedTask.data.task.urgency]}>
                    {relatedTask.data.task.urgency}
                  </Badge>
                  <Badge
                    color={
                      relatedTask.data.task.status === "completed"
                        ? "green"
                        : "gray"
                    }
                  >
                    {relatedTask.data.task.status}
                  </Badge>
                </Group>
                <Text size="sm">
                  {
                    relatedTask.data.task.subtasks.filter(
                      (subtask) => subtask.completedAt,
                    ).length
                  }
                  /{relatedTask.data.task.subtasks.length} steps completed
                </Text>
                <Button
                  component={Link}
                  to={`/tasks/${question.taskId}`}
                  variant="light"
                  size="xs"
                >
                  Open full task
                </Button>
              </Stack>
            )}
          </div>
        )}
      </Card>
    </SimpleGrid>
  );
}
function Questions() {
  const user = useAuthStore((state) => state.user)!;
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["questions"],
    queryFn: questionApi.list,
  });
  const tasks = useQuery({
    queryKey: ["tasks"],
    queryFn: taskApi.list,
    enabled: user.role === "member",
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
        <Title>{user.role === "host" ? "All Questions" : "My Questions"}</Title>
        {user.role === "member" && (
          <Button onClick={() => setOpen(true)}>Ask host</Button>
        )}
      </Group>
      {questions.length ? (
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              isHost={user.role === "host"}
              onStatusChange={(id, status, answerText) =>
                update.mutate({ id, status, answerText })
              }
              onUrgencyChange={(id, urgency) =>
                updateUrgency.mutate({ id, urgency })
              }
              onEdit={
                user.role === "member"
                  ? (content) => edit.mutate({ id: question.id, content })
                  : undefined
              }
              onDelete={
                user.role === "member"
                  ? () => remove.mutate(question.id)
                  : undefined
              }
            />
          ))}
        </SimpleGrid>
      ) : (
        <EmptyState
          message={
            user.role === "host" ? "No questions yet." : "No questions yet."
          }
          action={
            user.role === "host" ? (
              <Button component={Link} to="/host/tasks/new">
                Create task
              </Button>
            ) : (
              <Button onClick={() => setOpen(true)}>Ask a question</Button>
            )
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
function Home() {
  const user = useAuthStore((state) => state.user);
  return (
    <Navigate
      to={user?.role === "host" ? "/host/tasks" : "/me/tasks"}
      replace
    />
  );
}
function RequireAuth({ children }: { children: ReactNode }) {
  const { token, user } = useAuthStore();
  return token && user ? <>{children}</> : <Navigate to="/login" replace />;
}
function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage register />} />
      <Route
        path="/me/tasks"
        element={
          <RequireAuth>
            <TaskList />
          </RequireAuth>
        }
      />
      <Route
        path="/tasks/:taskId"
        element={
          <RequireAuth>
            <TaskDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/me/questions"
        element={
          <RequireAuth>
            <Questions />
          </RequireAuth>
        }
      />
      <Route
        path="/host/tasks"
        element={
          <RequireAuth>
            <TaskList host />
          </RequireAuth>
        }
      />
      <Route
        path="/host/tasks/new"
        element={
          <RequireAuth>
            <TaskForm />
          </RequireAuth>
        }
      />
      <Route
        path="/host/tasks/:taskId/edit"
        element={
          <RequireAuth>
            <TaskForm edit />
          </RequireAuth>
        }
      />
      <Route
        path="/host/questions"
        element={
          <RequireAuth>
            <Questions />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
createRoot(document.getElementById("root")!).render(
  <MantineProvider theme={weddingTheme} defaultColorScheme="light">
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </MantineProvider>,
);
