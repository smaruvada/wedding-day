import "dotenv/config";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db, pool } from "./index.js";
import { events, subtasks, tasks, users } from "./schema.js";
const [existingEvent] = await db.select().from(events).limit(1);
const event =
  existingEvent ??
  (
    await db
      .insert(events)
      .values({ name: "Ankita & Partner Wedding" })
      .returning()
  )[0];
const hash = await bcrypt.hash("Wedding123!", 12);
async function seedUser(
  name: string,
  email: string,
  role: "host" | "member",
  roleType: "bride" | null = null,
  previousEmail?: string,
) {
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  const [previousUser] =
    existingUser || !previousEmail
      ? []
      : await db
          .select()
          .from(users)
          .where(eq(users.email, previousEmail))
          .limit(1);
  const user = existingUser ?? previousUser;
  if (user)
    return (
      await db
        .update(users)
        .set({ name, email, role, roleType, eventId: event.id })
        .where(eq(users.id, user.id))
        .returning()
    )[0];
  return (
    await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash: hash,
        role,
        roleType,
        eventId: event.id,
      })
      .returning()
  )[0];
}
const host = await seedUser(
  "Ankita",
  "ankita@wedding.test",
  "host",
  "bride",
  "host@wedding.test",
);
const thej = await seedUser(
  "Thej",
  "thej@wedding.test",
  "member",
  null,
  "maya@wedding.test",
);
await seedUser(
  "Shashank",
  "shashank@wedding.test",
  "member",
  null,
  "jamie@wedding.test",
);
const [existingTask] = await db
  .select()
  .from(tasks)
  .where(
    and(eq(tasks.eventId, event.id), eq(tasks.title, "Prepare welcome bags")),
  )
  .limit(1);
if (!existingTask) {
  const [task] = await db
    .insert(tasks)
    .values({
      eventId: event.id,
      title: "Prepare welcome bags",
      description: "Assemble bags for hotel guests.",
      assignedToUserId: thej.id,
      hostCreatedByUserId: host.id,
      urgency: "high",
      photoRequired: true,
    })
    .returning();
  await db.insert(subtasks).values([
    { taskId: task.id, title: "Count welcome bags", sortOrder: 1 },
    { taskId: task.id, title: "Pack itineraries", sortOrder: 2 },
  ]);
}
await pool.end();
