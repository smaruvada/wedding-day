import { Badge, Card, Group, Text } from "@mantine/core";
import { MouseEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Task } from "../types";
import { urgencyColors } from "./QuestionUrgencyBadge";
import { RelatedQuestionModal } from "./RelatedQuestionModal";

export function TaskCard({ task, host = false }: { task: Task; host?: boolean }) {
  const navigate = useNavigate();
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const relatedQuestion = task.relatedQuestions?.find(
    (question) => question.status === "open",
  );
  const openRelatedQuestion = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setQuestionModalOpen(true);
  };

  return (
    <>
    <Card
      withBorder
      className="task-card-link"
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/tasks/${task.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(`/tasks/${task.id}`);
        }
      }}
    >
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <div className="task-card-content">
          <Text fw={600}>{task.title}</Text>
          <Text size="sm" c="dimmed">
            {task.assignee?.name ?? (task.assignedToUserId ? `${task.subtasks.filter((subtask) => subtask.completedAt).length}/${task.subtasks.length} steps completed` : "Unassigned")}
          </Text>
        </div>
        <Group wrap="nowrap" className="task-card-badges">
          {host && !!task.openQuestionCount && relatedQuestion && (
            <button
              type="button"
              className="question-count-badge-button"
              onClick={openRelatedQuestion}
              aria-label={`Open ${task.openQuestionCount} related ${task.openQuestionCount === 1 ? "question" : "questions"}`}
            >
              <Badge color="rose" variant="light">{task.openQuestionCount} {task.openQuestionCount === 1 ? "question" : "questions"}</Badge>
            </button>
          )}
          {task.status === "completed" ? <Badge color="green">completed</Badge> : <Badge color={urgencyColors[task.urgency]}>{task.urgency}</Badge>}
        </Group>
      </Group>
    </Card>
    <RelatedQuestionModal
      question={relatedQuestion}
      opened={questionModalOpen}
      onClose={() => setQuestionModalOpen(false)}
      onQuestionUpdated={() => undefined}
    />
    </>
  );
}
