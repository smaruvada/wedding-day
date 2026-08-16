import { create } from "zustand";
import { User } from "./types";
interface AuthState {
  token: string | null;
  user: User | null;
  viewMode: "host" | "member";
  setAuth: (token: string, user: User) => void;
  setViewMode: (viewMode: "host" | "member") => void;
  clear: () => void;
}
export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("token"),
  user: JSON.parse(localStorage.getItem("user") ?? "null"),
  viewMode: localStorage.getItem("viewMode") === "member" ? "member" : "host",
  setAuth: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    const viewMode = user.role === "member" ? "member" : "host";
    localStorage.setItem("viewMode", viewMode);
    set({ token, user, viewMode });
  },
  setViewMode: (viewMode) => {
    localStorage.setItem("viewMode", viewMode);
    set({ viewMode });
  },
  clear: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("viewMode");
    set({ token: null, user: null, viewMode: "host" });
  },
}));
