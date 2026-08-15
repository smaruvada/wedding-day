import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
export const roleEnum = pgEnum("role", ["member", "host"]);
export const hostTypeEnum = pgEnum("host_type", [
  "bride",
  "maid_of_honor",
  "planner",
  "other",
]);
export const urgencyEnum = pgEnum("urgency", [
  "low",
  "medium",
  "high",
  "urgent",
]);
export const taskStatusEnum = pgEnum("task_status", ["open", "completed"]);
export const questionStatusEnum = pgEnum("question_status", [
  "open",
  "resolved",
]);
const dates = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ...dates,
});
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: roleEnum("role").notNull(),
    hostType: hostTypeEnum("host_type"),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id),
    ...dates,
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id),
  title: text("title").notNull(),
  description: text("description"),
  assignedToUserId: integer("assigned_to_user_id")
    .references(() => users.id),
  hostCreatedByUserId: integer("host_created_by_user_id")
    .notNull()
    .references(() => users.id),
  urgency: urgencyEnum("urgency").notNull().default("low"),
  status: taskStatusEnum("status").notNull().default("open"),
  photoRequired: boolean("photo_required").notNull().default(false),
  ...dates,
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const subtasks = pgTable("subtasks", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull(),
  completedByUserId: integer("completed_by_user_id").references(() => users.id),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
export const taskPhotos = pgTable("task_photos", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  uploadedByUserId: integer("uploaded_by_user_id")
    .notNull()
    .references(() => users.id),
  filePath: text("file_path").notNull(),
  ...dates,
});
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id),
  askedByUserId: integer("asked_by_user_id")
    .notNull()
    .references(() => users.id),
  taskId: integer("task_id").references(() => tasks.id),
  content: text("content").notNull(),
  urgency: urgencyEnum("urgency").notNull().default("low"),
  status: questionStatusEnum("status").notNull().default("open"),
  answerText: text("answer_text"),
  ...dates,
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const questionPhotos = pgTable("question_photos", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  uploadedByUserId: integer("uploaded_by_user_id")
    .notNull()
    .references(() => users.id),
  filePath: text("file_path").notNull(),
  ...dates,
});
