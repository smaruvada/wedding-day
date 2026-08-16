import "@mantine/core/styles.css";
import "./wedding.css";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Container,
  FileButton,
  Group,
  MantineProvider,
  Modal,
  PasswordInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
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
import { EmptyState, ErrorBox, Loading } from "./components/feedback";
import { Layout } from "./components/Layout";
import {
  QuestionUrgencyBadge,
  urgencyColors,
} from "./components/QuestionUrgencyBadge";
import { TaskCard } from "./components/TaskCard";
import { EditableSubtask, SubtaskEditor } from "./components/SubtaskEditor";
import {
  MemberQuestionEditModal,
  RelatedQuestionMemberActions,
} from "./components/MemberQuestionActions";
import { QuestionPhotos, TaskPhotos } from "./components/photos";
import { TaskListPage } from "./pages/TaskListPage";
import { QuestionsPage } from "./pages/QuestionsPage";
import { TaskDetailPage } from "./pages/TaskDetailPage";
import { TaskFormPage } from "./pages/TaskFormPage";
import { useAuthStore } from "./store";
import { Question, Task } from "./types";
import { weddingTheme } from "./theme";
const queryClient = new QueryClient();
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
            <TaskListPage />
          </RequireAuth>
        }
      />
      <Route
        path="/tasks/:taskId"
        element={
          <RequireAuth>
            <TaskDetailPage />
          </RequireAuth>
        }
      />
      <Route
        path="/me/questions"
        element={
          <RequireAuth>
            <QuestionsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/host/tasks"
        element={
          <RequireAuth>
            <TaskListPage host />
          </RequireAuth>
        }
      />
      <Route
        path="/host/tasks/new"
        element={
          <RequireAuth>
            <TaskFormPage />
          </RequireAuth>
        }
      />
      <Route
        path="/host/tasks/:taskId/edit"
        element={
          <RequireAuth>
            <TaskFormPage edit />
          </RequireAuth>
        }
      />
      <Route
        path="/host/questions"
        element={
          <RequireAuth>
            <QuestionsPage />
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
