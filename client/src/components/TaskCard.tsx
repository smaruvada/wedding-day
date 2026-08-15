import { Badge, Card, Group, Text } from "@mantine/core";
import { Link } from "react-router-dom";
import { Task } from "../types";
import { urgencyColors } from "./QuestionUrgencyBadge";

export function TaskCard({ task, host = false }: { task: Task; host?: boolean }) {
  return (
    <Card component={Link} to={`/tasks/${task.id}`} withBorder className="task-card-link">
      <Group justify="space-between">
        <div>
          <Text fw={600}>{task.title}</Text>
          <Text size="sm" c="dimmed">
            {task.assignee?.name ?? `${task.subtasks.filter((subtask) => subtask.completedAt).length}/${task.subtasks.length} steps completed`}
          </Text>
        </div>
        <Group>
          {host && !!task.openQuestionCount && <Badge color="rose" variant="light">{task.openQuestionCount} open {task.openQuestionCount === 1 ? "question" : "questions"}</Badge>}
          {task.status === "completed" ? <Badge color="green">completed</Badge> : <Badge color={urgencyColors[task.urgency]}>{task.urgency}</Badge>}
        </Group>
      </Group>
    </Card>
  );
}
