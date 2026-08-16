export type Role = "member" | "host" | "admin";
export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: Role;
  eventId: number;
  roleType: string | null;
}
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
