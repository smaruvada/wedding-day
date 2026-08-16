import bcrypt from "bcryptjs";
import { asc, eq } from "drizzle-orm";
import { db } from "./index.js";
import { events, users } from "./schema.js";

export async function ensureAdmin() {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, "admin"))
    .limit(1);
  if (existing) return;
  const [event] = await db.select().from(events).orderBy(asc(events.id)).limit(1);
  const targetEvent = event ?? (
    await db.insert(events).values({ name: "Wedding Day Event" }).returning()
  )[0];
  await db.insert(users).values({
    name: "admin",
    email: "admin",
    passwordHash: await bcrypt.hash("Wedding123!", 12),
    role: "admin",
    hostType: null,
    eventId: targetEvent.id,
  });
}
