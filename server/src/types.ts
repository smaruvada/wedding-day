export type Role = "member" | "host" | "admin";
export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: Role;
  eventId: number;
  hostType: string | null;
}
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
