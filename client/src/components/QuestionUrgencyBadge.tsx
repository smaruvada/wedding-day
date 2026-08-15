import { Badge, Menu } from "@mantine/core";
import { Question, Urgency } from "../types";

export const urgencyColors: Record<Urgency, string> = {
  low: "sage",
  medium: "blue",
  high: "orange",
  urgent: "red",
};

export function QuestionUrgencyBadge({
  question,
  isHost,
  onChange,
}: {
  question: Question;
  isHost: boolean;
  onChange: (urgency: string) => void;
}) {
  if (!isHost) return <Badge color={urgencyColors[question.urgency]}>{question.urgency}</Badge>;

  return (
    <Menu position="bottom-start">
      <Menu.Target>
        <button type="button" className="urgency-badge-button" aria-label={`Change urgency from ${question.urgency}`}>
          <Badge color={urgencyColors[question.urgency]}>{question.urgency}</Badge>
        </button>
      </Menu.Target>
      <Menu.Dropdown>
        {(["low", "medium", "high", "urgent"] as Urgency[]).map((urgency) => (
          <Menu.Item key={urgency} onClick={() => onChange(urgency)}>{urgency}</Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
