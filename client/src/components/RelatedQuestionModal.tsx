import { Alert, Badge, Button, Group, Modal, Stack, Text, Textarea } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { questionApi } from "../api";
import { RelatedQuestion } from "../types";
import { QuestionUrgencyBadge } from "./QuestionUrgencyBadge";
import { QuestionPhotos } from "./photos";

export function RelatedQuestionModal({
  question,
  opened,
  onClose,
  onQuestionUpdated,
}: {
  question: RelatedQuestion | undefined;
  opened: boolean;
  onClose: () => void;
  onQuestionUpdated: () => void;
}) {
  const client = useQueryClient();
  const [answerText, setAnswerText] = useState("");
  useEffect(() => setAnswerText(question?.answerText ?? ""), [question]);
  const resolveQuestion = useMutation({
    mutationFn: () => questionApi.updateStatus(question!.id, { status: "resolved", answerText }),
    onSuccess: () => {
      onClose();
      onQuestionUpdated();
      client.invalidateQueries({ queryKey: ["questions"] });
      client.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
  const updateUrgency = useMutation({
    mutationFn: (urgency: string) => questionApi.updateUrgency(question!.id, urgency),
    onSuccess: () => {
      onQuestionUpdated();
      client.invalidateQueries({ queryKey: ["questions"] });
      client.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Related question">
      <Stack>
        {question && (
          <>
            <Text fw={600}>{question.content}</Text>
            <Group gap="xs">
              <QuestionUrgencyBadge question={question} isHost onChange={(urgency) => updateUrgency.mutate(urgency)} />
              <Badge color={question.status === "resolved" ? "green" : "gray"}>{question.status}</Badge>
            </Group>
            {question.answerText && <Alert color="blue">{question.answerText}</Alert>}
            <QuestionPhotos photos={question.photos} />
            <Textarea value={answerText} onChange={(event) => setAnswerText(event.currentTarget.value)} placeholder="Write an answer" />
            <Group justify="flex-end">
              <Button variant="light" onClick={onClose}>Cancel</Button>
              {question.status === "resolved" ? (
                <Button
                  onClick={() =>
                    void questionApi.updateStatus(question.id, { status: "open" }).then(() => {
                      onClose();
                      onQuestionUpdated();
                      client.invalidateQueries({ queryKey: ["questions"] });
                      client.invalidateQueries({ queryKey: ["tasks"] });
                    })
                  }
                >
                  Unresolve
                </Button>
              ) : (
                <Button onClick={() => resolveQuestion.mutate()} loading={resolveQuestion.isPending} disabled={!answerText.trim()}>
                  Answer
                </Button>
              )}
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}
