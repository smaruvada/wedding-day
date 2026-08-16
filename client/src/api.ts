import axios from "axios";
import { useAuthStore } from "./store";
import { Question, Task, User } from "./types";

export type ImportedTask = {
  title: string;
  description?: string;
  urgency?: "low" | "medium" | "high" | "urgent";
};
export const api = axios.create();
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 401) useAuthStore.getState().clear();
  return Promise.reject(error);
});
const data = <T>(
  request: Promise<{
    data: T;
  }>,
) => request.then((response) => response.data);
export const authApi = {
  login: (payload: { email: string; password: string }) =>
    data<{
      token: string;
      user: User;
    }>(api.post("/auth/login", payload)),
  register: (payload: object) =>
    data<{
      token: string;
      user: User;
    }>(api.post("/auth/register", payload)),
  me: () =>
    data<{
      user: User;
    }>(api.get("/auth/me")),
  updateProfile: (payload: { name: string }) =>
    data<{ user: User }>(api.patch("/auth/me", payload)),
  changePassword: (currentPassword: string, newPassword: string) =>
    data<void>(api.patch("/auth/me/password", { currentPassword, newPassword })),
};
export const taskApi = {
  list: () =>
    data<{
      tasks: Task[];
    }>(api.get("/tasks")),
  get: (id: string) =>
    data<{
      task: Task;
    }>(api.get(`/tasks/${id}`)),
  members: () =>
    data<{
      users: Pick<User, "id" | "name" | "email">[];
    }>(api.get("/members")),
  create: (payload: object) =>
    data<{
      task: Task;
    }>(api.post("/tasks", payload)),
  import: (tasks: ImportedTask[]) =>
    data<{
      tasks: Task[];
    }>(api.post("/tasks/import", { tasks })),
  update: (taskId: number, payload: object) =>
    data<{
      task: Task;
    }>(api.patch(`/tasks/${taskId}`, payload)),
  remove: (taskId: number) => data<void>(api.delete(`/tasks/${taskId}`)),
  complete: (taskId: number, subtaskId: number) =>
    data<{
      task: Task;
    }>(api.post(`/tasks/${taskId}/subtasks/${subtaskId}/complete`)),
  redelegate: (taskId: number, assignedToUserId: number) =>
    data<{
      task: Task;
    }>(api.post(`/tasks/${taskId}/redelegate`, { assignedToUserId })),
  upload: (taskId: number, file: File) => {
    const form = new FormData();
    form.append("photo", file);
    return data<{
      task: Task;
    }>(api.post(`/tasks/${taskId}/photos`, form));
  },
  removePhoto: (taskId: number, photoId: number) =>
    data<void>(api.delete(`/tasks/${taskId}/photos/${photoId}`)),
};
export const questionApi = {
  list: () =>
    data<{
      questions: Question[];
    }>(api.get("/questions")),
  create: (payload: object) =>
    data<{
      question: Question;
    }>(api.post("/questions", payload)),
  remove: (id: number) => data<void>(api.delete(`/questions/${id}`)),
  removePhoto: (photoId: number) =>
    data<void>(api.delete(`/questions/photos/${photoId}`)),
  update: (id: number, payload: object) =>
    data<{
      question: Question;
    }>(api.patch(`/questions/${id}`, payload)),
  updateStatus: (id: number, payload: object) =>
    data<{
      question: Question;
    }>(api.post(`/questions/${id}/status`, payload)),
  updateUrgency: (id: number, urgency: string) =>
    data<{
      question: Question;
    }>(api.post(`/questions/${id}/urgency`, { urgency })),
  upload: (id: number, file: File) => {
    const form = new FormData();
    form.append("photo", file);
    return data(api.post(`/questions/${id}/photos`, form));
  },
};
export const adminApi = {
  users: () => data<{ users: Array<User & { createdAt: string }> }>(api.get("/admin/users")),
  createUser: (payload: object) =>
    data<{ user: User }>(api.post("/admin/users", payload)),
  updateUser: (id: number, payload: object) =>
    data<{ user: User }>(api.patch(`/admin/users/${id}`, payload)),
  deleteUser: (id: number) => data<void>(api.delete(`/admin/users/${id}`)),
};
