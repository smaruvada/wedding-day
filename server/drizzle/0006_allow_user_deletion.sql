ALTER TABLE "tasks" ALTER COLUMN "host_created_by_user_id" DROP NOT NULL;
ALTER TABLE "task_photos" ALTER COLUMN "uploaded_by_user_id" DROP NOT NULL;
ALTER TABLE "questions" ALTER COLUMN "asked_by_user_id" DROP NOT NULL;
ALTER TABLE "question_photos" ALTER COLUMN "uploaded_by_user_id" DROP NOT NULL;

ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assigned_to_user_id_fkey";
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_host_created_by_user_id_fkey";
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_host_created_by_user_id_fkey" FOREIGN KEY ("host_created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "subtasks" DROP CONSTRAINT "subtasks_completed_by_user_id_fkey";
ALTER TABLE "subtasks" ADD CONSTRAINT "subtasks_completed_by_user_id_fkey" FOREIGN KEY ("completed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "task_photos" DROP CONSTRAINT "task_photos_uploaded_by_user_id_fkey";
ALTER TABLE "task_photos" ADD CONSTRAINT "task_photos_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "questions" DROP CONSTRAINT "questions_asked_by_user_id_fkey";
ALTER TABLE "questions" ADD CONSTRAINT "questions_asked_by_user_id_fkey" FOREIGN KEY ("asked_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "question_photos" DROP CONSTRAINT "question_photos_uploaded_by_user_id_fkey";
ALTER TABLE "question_photos" ADD CONSTRAINT "question_photos_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
