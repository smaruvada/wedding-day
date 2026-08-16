import bcrypt from "bcryptjs";
import { Router } from "express";
import multer from "multer";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { signToken } from "./auth.js";
import { db } from "./db/index.js";
import {
  events,
  questionPhotos,
  questions,
  subtasks,
  taskPhotos,
  tasks,
  users,
} from "./db/schema.js";
import { requireAuth, requireRole } from "./middleware.js";
import { calculateTaskStatus } from "./services/completion.js";
import { storage } from "./storage.js";
import { AuthUser } from "./types.js";
const urgency = z.enum(["low", "medium", "high", "urgent"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, done) =>
    done(null, file.mimetype.startsWith("image/")),
});
const publicUser = (user: typeof users.$inferSelect): AuthUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  eventId: user.eventId,
  hostType: user.hostType,
});
const fail = (res: any, error: unknown) =>
  res
    .status(400)
    .json({
      error: error instanceof Error ? error.message : "Invalid request",
    });
async function hydrateTask(task: typeof tasks.$inferSelect) {
  const [taskSubtasks, photos, assignee, relatedQuestionRows] =
    await Promise.all([
      db
        .select()
        .from(subtasks)
        .where(eq(subtasks.taskId, task.id))
        .orderBy(asc(subtasks.sortOrder)),
      db
        .select()
        .from(taskPhotos)
        .where(eq(taskPhotos.taskId, task.id))
        .orderBy(desc(taskPhotos.createdAt)),
      task.assignedToUserId === null
        ? Promise.resolve([])
        : db
            .select({ id: users.id, name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, task.assignedToUserId))
            .limit(1),
      db
        .select()
        .from(questions)
        .where(eq(questions.taskId, task.id))
        .orderBy(
          sql`case ${questions.status} when 'open' then 0 else 1 end`,
          desc(questions.updatedAt),
        ),
    ]);
  const relatedQuestions = await Promise.all(
    relatedQuestionRows.map(async (question) => ({
      ...question,
      photos: await db
        .select()
        .from(questionPhotos)
        .where(eq(questionPhotos.questionId, question.id)),
    })),
  );
  return {
    ...task,
    subtasks: taskSubtasks,
    photos,
    assignee: assignee[0],
    relatedQuestions,
    openQuestionCount: relatedQuestions.filter(
      (question) => question.status === "open",
    ).length,
  };
}
async function loadTaskForUser(taskId: number, user: AuthUser) {
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.eventId, user.eventId)))
    .limit(1);
  if (!task || (user.role === "member" && task.assignedToUserId !== user.id))
    return null;
  return task;
}
async function refreshStatus(task: typeof tasks.$inferSelect) {
  const [allSubtasks, photos] = await Promise.all([
    db.select().from(subtasks).where(eq(subtasks.taskId, task.id)),
    db.select().from(taskPhotos).where(eq(taskPhotos.taskId, task.id)),
  ]);
  const status = calculateTaskStatus(
    allSubtasks,
    task.photoRequired,
    photos.length,
  );
  await db
    .update(tasks)
    .set({ status, updatedAt: new Date() })
    .where(eq(tasks.id, task.id));
  return status;
}
export const authRouter = Router();
authRouter.post("/register", async (req, res) => {
  try {
    const input = z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1),
      })
      .parse(req.body);
    const [event] = await db.select().from(events).limit(1);
    const targetEvent =
      event ??
      (
        await db
          .insert(events)
          .values({ name: "Wedding Day Event" })
          .returning()
      )[0];
    const hash = await bcrypt.hash(input.password, 12);
    const [user] = await db
      .insert(users)
      .values({
        ...input,
        passwordHash: hash,
        eventId: targetEvent.id,
        role: "member",
        hostType: null,
      })
      .returning();
    const safeUser = publicUser(user);
    res.status(201).json({ token: signToken(safeUser), user: safeUser });
  } catch (error) {
    fail(res, error);
  }
});
authRouter.post("/login", async (req, res) => {
  try {
    const input = z
      .object({ email: z.string().email(), password: z.string() })
      .parse(req.body);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash)))
      return res.status(401).json({ error: "Invalid email or password" });
    const safeUser = publicUser(user);
    res.json({ token: signToken(safeUser), user: safeUser });
  } catch (error) {
    fail(res, error);
  }
});
authRouter.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));
export const taskRouter = Router();
taskRouter.use(requireAuth);
taskRouter.post("/", requireRole("host"), async (req, res) => {
  try {
    const input = z
      .object({
        title: z.string().min(1),
        description: z.string().optional(),
        assignedToUserId: z.number().int(),
        urgency,
        photoRequired: z.boolean().default(false),
        subtasks: z.array(z.object({ title: z.string().min(1) })).min(1),
      })
      .parse(req.body);
    const [assignee] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, input.assignedToUserId),
          eq(users.eventId, req.user!.eventId),
          eq(users.role, "member"),
        ),
      )
      .limit(1);
    if (!assignee)
      return res
        .status(400)
        .json({ error: "Assignee must be an event member" });
    const [task] = await db
      .insert(tasks)
      .values({
        ...input,
        description: input.description || null,
        eventId: req.user!.eventId,
        hostCreatedByUserId: req.user!.id,
      })
      .returning();
    await db
      .insert(subtasks)
      .values(
        input.subtasks.map((subtask, index) => ({
          taskId: task.id,
          title: subtask.title,
          sortOrder: index + 1,
        })),
      );
    res.status(201).json({ task: await hydrateTask(task) });
  } catch (error) {
    fail(res, error);
  }
});
taskRouter.post("/import", requireRole("host"), async (req, res) => {
  try {
    const input = z
      .object({
        titles: z.array(z.string().trim().min(1).max(500)).min(1).max(100),
      })
      .parse(req.body);
    const createdTasks = await db.transaction(async (transaction) =>
      transaction
        .insert(tasks)
        .values(
          input.titles.map((title) => ({
            title,
            eventId: req.user!.eventId,
            hostCreatedByUserId: req.user!.id,
          })),
        )
        .returning(),
    );
    res.status(201).json({ tasks: await Promise.all(createdTasks.map(hydrateTask)) });
  } catch (error) {
    fail(res, error);
  }
});
taskRouter.get("/", async (req, res) => {
  const where =
    req.user!.role === "host"
      ? eq(tasks.eventId, req.user!.eventId)
      : and(
          eq(tasks.eventId, req.user!.eventId),
          eq(tasks.assignedToUserId, req.user!.id),
        );
  const rows = await db
    .select()
    .from(tasks)
    .where(where)
    .orderBy(
      sql`case ${tasks.status} when 'completed' then 1 else 0 end`,
      sql`case ${tasks.urgency} when 'urgent' then 1 when 'high' then 2 when 'medium' then 3 else 4 end`,
      desc(tasks.updatedAt),
    );
  res.json({ tasks: await Promise.all(rows.map(hydrateTask)) });
});
taskRouter.get("/:taskId", async (req, res) => {
  const task = await loadTaskForUser(Number(req.params.taskId), req.user!);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json({ task: await hydrateTask(task) });
});
taskRouter.patch("/:taskId", requireRole("host"), async (req, res) => {
  try {
    const task = await loadTaskForUser(Number(req.params.taskId), req.user!);
    if (!task) return res.status(404).json({ error: "Task not found" });
    const input = z
      .object({
        title: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        urgency: urgency.optional(),
        photoRequired: z.boolean().optional(),
        subtasks: z
          .array(
            z.object({
              id: z.number().int().positive().optional(),
              title: z.string().min(1),
            }),
          )
          .min(1)
          .optional(),
      })
      .parse(req.body);
    const { subtasks: replacementSubtasks, ...changes } = input;
    const [updated] = await db
      .update(tasks)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(tasks.id, task.id))
      .returning();
    if (replacementSubtasks) {
      const existingSubtasks = await db
        .select()
        .from(subtasks)
        .where(eq(subtasks.taskId, task.id));
      const existingIds = new Set(
        existingSubtasks.map((subtask) => subtask.id),
      );
      const retainedIds = new Set(
        replacementSubtasks.flatMap((subtask) =>
          subtask.id ? [subtask.id] : [],
        ),
      );
      if ([...retainedIds].some((subtaskId) => !existingIds.has(subtaskId)))
        throw new Error("Invalid subtask");
      await Promise.all(
        existingSubtasks
          .filter((subtask) => !retainedIds.has(subtask.id))
          .map((subtask) =>
            db.delete(subtasks).where(eq(subtasks.id, subtask.id)),
          ),
      );
      await Promise.all(
        replacementSubtasks.map((subtask, index) =>
          subtask.id
            ? db
                .update(subtasks)
                .set({ title: subtask.title, sortOrder: index + 1 })
                .where(eq(subtasks.id, subtask.id))
            : db
                .insert(subtasks)
                .values({
                  taskId: task.id,
                  title: subtask.title,
                  sortOrder: index + 1,
                }),
        ),
      );
    }
    await refreshStatus(updated);
    const [fresh] = await db.select().from(tasks).where(eq(tasks.id, task.id));
    res.json({ task: await hydrateTask(fresh) });
  } catch (error) {
    fail(res, error);
  }
});
taskRouter.delete("/:taskId", requireRole("host"), async (req, res) => {
  try {
    const task = await loadTaskForUser(Number(req.params.taskId), req.user!);
    if (!task) return res.status(404).json({ error: "Task not found" });
    const photos = await db
      .select({ filePath: taskPhotos.filePath })
      .from(taskPhotos)
      .where(eq(taskPhotos.taskId, task.id));
    await db.transaction(async (transaction) => {
      await transaction
        .update(questions)
        .set({ taskId: null, updatedAt: new Date() })
        .where(eq(questions.taskId, task.id));
      await transaction.delete(tasks).where(eq(tasks.id, task.id));
    });
    await Promise.allSettled(photos.map((photo) => storage.remove(photo.filePath)));
    res.status(204).send();
  } catch (error) {
    fail(res, error);
  }
});
taskRouter.post("/:taskId/subtasks/:subtaskId/complete", async (req, res) => {
  const task = await loadTaskForUser(Number(req.params.taskId), req.user!);
  if (!task)
    return res.status(403).json({ error: "You cannot update this task" });
  const [subtask] = await db
    .select()
    .from(subtasks)
    .where(
      and(
        eq(subtasks.id, Number(req.params.subtaskId)),
        eq(subtasks.taskId, task.id),
      ),
    )
    .limit(1);
  if (!subtask) return res.status(404).json({ error: "Subtask not found" });
  await db
    .update(subtasks)
    .set(
      subtask.completedAt
        ? { completedByUserId: null, completedAt: null }
        : { completedByUserId: req.user!.id, completedAt: new Date() },
    )
    .where(eq(subtasks.id, subtask.id));
  await refreshStatus(task);
  const [updated] = await db.select().from(tasks).where(eq(tasks.id, task.id));
  res.json({ task: await hydrateTask(updated) });
});
taskRouter.post(
  "/:taskId/photos",
  requireRole("member"),
  upload.single("photo"),
  async (req, res) => {
    const task = await loadTaskForUser(Number(req.params.taskId), req.user!);
    if (!task)
      return res.status(403).json({ error: "You cannot upload for this task" });
    if (!req.file)
      return res.status(400).json({ error: "An image file is required" });
    const filePath = await storage.save(req.file);
    const [photo] = await db
      .insert(taskPhotos)
      .values({ taskId: task.id, uploadedByUserId: req.user!.id, filePath })
      .returning();
    await refreshStatus(task);
    const [updated] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, task.id));
    res.status(201).json({ photo, task: await hydrateTask(updated) });
  },
);
taskRouter.delete("/:taskId/photos/:photoId", async (req, res) => {
  const task = await loadTaskForUser(Number(req.params.taskId), req.user!);
  if (!task)
    return res.status(403).json({ error: "You cannot delete this photo" });
  const [photo] = await db
    .select()
    .from(taskPhotos)
    .where(
      and(
        eq(taskPhotos.id, Number(req.params.photoId)),
        eq(taskPhotos.taskId, task.id),
      ),
    )
    .limit(1);
  if (!photo) return res.status(404).json({ error: "Photo not found" });
  if (req.user!.role === "member" && photo.uploadedByUserId !== req.user!.id)
    return res
      .status(403)
      .json({ error: "You can only delete your own photos" });
  await db.delete(taskPhotos).where(eq(taskPhotos.id, photo.id));
  await storage.remove(photo.filePath);
  await refreshStatus(task);
  res.status(204).send();
});
taskRouter.post(
  "/:taskId/redelegate",
  requireRole("host"),
  async (req, res) => {
    try {
      const task = await loadTaskForUser(Number(req.params.taskId), req.user!);
      if (!task) return res.status(404).json({ error: "Task not found" });
      const input = z
        .object({ assignedToUserId: z.number().int() })
        .parse(req.body);
      const [assignee] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, input.assignedToUserId),
            eq(users.eventId, req.user!.eventId),
            eq(users.role, "member"),
          ),
        )
        .limit(1);
      if (!assignee)
        return res
          .status(400)
          .json({ error: "Assignee must be an event member" });
      const [updated] = await db
        .update(tasks)
        .set({
          assignedToUserId: input.assignedToUserId,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, task.id))
        .returning();
      res.json({ task: await hydrateTask(updated) });
    } catch (error) {
      fail(res, error);
    }
  },
);
export const questionRouter = Router();
questionRouter.use(requireAuth);
questionRouter.post("/", requireRole("member"), async (req, res) => {
  try {
    const input = z
      .object({
        content: z.string().min(1),
        taskId: z.number().int(),
        urgency: urgency.default("low"),
      })
      .parse(req.body);
    const task = await loadTaskForUser(input.taskId, req.user!);
    if (!task)
      return res
        .status(403)
        .json({ error: "Questions can only be linked to your tasks" });
    const [question] = await db
      .insert(questions)
      .values({
        ...input,
        eventId: req.user!.eventId,
        askedByUserId: req.user!.id,
      })
      .returning();
    res.status(201).json({ question });
  } catch (error) {
    fail(res, error);
  }
});
questionRouter.get("/", async (req, res) => {
  const visibility =
    req.user!.role === "host"
      ? eq(questions.eventId, req.user!.eventId)
      : and(
          eq(questions.eventId, req.user!.eventId),
          eq(questions.askedByUserId, req.user!.id),
        );
  const rows = await db
    .select()
    .from(questions)
    .where(and(visibility, eq(questions.status, "open")))
    .orderBy(
      sql`case ${questions.urgency} when 'urgent' then 1 when 'high' then 2 when 'medium' then 3 else 4 end`,
      desc(questions.updatedAt),
    );
  const result = await Promise.all(
    rows.map(async (question) => ({
      ...question,
      photos: await db
        .select()
        .from(questionPhotos)
        .where(eq(questionPhotos.questionId, question.id)),
    })),
  );
  res.json({ questions: result });
});
questionRouter.post(
  "/:questionId/photos",
  requireRole("member"),
  upload.single("photo"),
  async (req, res) => {
    const [question] = await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.id, Number(req.params.questionId)),
          eq(questions.askedByUserId, req.user!.id),
          eq(questions.eventId, req.user!.eventId),
        ),
      )
      .limit(1);
    if (!question)
      return res
        .status(403)
        .json({ error: "You cannot upload for this question" });
    if (!req.file)
      return res.status(400).json({ error: "An image file is required" });
    const filePath = await storage.save(req.file);
    const [photo] = await db
      .insert(questionPhotos)
      .values({
        questionId: question.id,
        uploadedByUserId: req.user!.id,
        filePath,
      })
      .returning();
    res.status(201).json({ photo });
  },
);
questionRouter.delete("/photos/:photoId", async (req, res) => {
  const [photo] = await db
    .select()
    .from(questionPhotos)
    .where(eq(questionPhotos.id, Number(req.params.photoId)))
    .limit(1);
  if (!photo) return res.status(404).json({ error: "Photo not found" });
  const [question] = await db
    .select()
    .from(questions)
    .where(
      and(
        eq(questions.id, photo.questionId),
        eq(questions.eventId, req.user!.eventId),
      ),
    )
    .limit(1);
  if (!question) return res.status(404).json({ error: "Question not found" });
  if (req.user!.role === "member" && question.askedByUserId !== req.user!.id)
    return res
      .status(403)
      .json({ error: "You can only delete photos from your own questions" });
  await db.delete(questionPhotos).where(eq(questionPhotos.id, photo.id));
  await storage.remove(photo.filePath);
  res.status(204).send();
});
questionRouter.delete(
  "/:questionId",
  requireRole("member"),
  async (req, res) => {
    const [question] = await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.id, Number(req.params.questionId)),
          eq(questions.askedByUserId, req.user!.id),
          eq(questions.eventId, req.user!.eventId),
        ),
      )
      .limit(1);
    if (!question) return res.status(404).json({ error: "Question not found" });
    const photos = await db
      .select()
      .from(questionPhotos)
      .where(eq(questionPhotos.questionId, question.id));
    await Promise.all(photos.map((photo) => storage.remove(photo.filePath)));
    await db.delete(questions).where(eq(questions.id, question.id));
    res.status(204).send();
  },
);
questionRouter.patch(
  "/:questionId",
  requireRole("member"),
  async (req, res) => {
    try {
      const input = z.object({ content: z.string().min(1) }).parse(req.body);
      const [question] = await db
        .update(questions)
        .set({ content: input.content, updatedAt: new Date() })
        .where(
          and(
            eq(questions.id, Number(req.params.questionId)),
            eq(questions.askedByUserId, req.user!.id),
            eq(questions.eventId, req.user!.eventId),
          ),
        )
        .returning();
      if (!question)
        return res.status(404).json({ error: "Question not found" });
      res.json({ question });
    } catch (error) {
      fail(res, error);
    }
  },
);
questionRouter.post(
  "/:questionId/status",
  requireRole("host"),
  async (req, res) => {
    try {
      const input = z
        .object({
          status: z.enum(["open", "resolved"]),
          answerText: z.string().optional(),
        })
        .parse(req.body);
      const [question] = await db
        .update(questions)
        .set({ ...input, updatedAt: new Date() })
        .where(
          and(
            eq(questions.id, Number(req.params.questionId)),
            eq(questions.eventId, req.user!.eventId),
          ),
        )
        .returning();
      if (!question)
        return res.status(404).json({ error: "Question not found" });
      res.json({ question });
    } catch (error) {
      fail(res, error);
    }
  },
);
questionRouter.post(
  "/:questionId/urgency",
  requireRole("host"),
  async (req, res) => {
    try {
      const input = z.object({ urgency }).parse(req.body);
      const [question] = await db
        .update(questions)
        .set({ ...input, updatedAt: new Date() })
        .where(
          and(
            eq(questions.id, Number(req.params.questionId)),
            eq(questions.eventId, req.user!.eventId),
          ),
        )
        .returning();
      if (!question)
        return res.status(404).json({ error: "Question not found" });
      res.json({ question });
    } catch (error) {
      fail(res, error);
    }
  },
);
export const memberRouter = Router();
memberRouter.use(requireAuth, requireRole("host"));
memberRouter.get("/", async (req, res) =>
  res.json({
    users: await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(
        and(eq(users.eventId, req.user!.eventId), eq(users.role, "member")),
      ),
  }),
);
