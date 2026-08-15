import { Button, Group, Modal, Stack, Textarea } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { questionApi } from "../api";
import { ErrorBox } from "./feedback";

export function MemberQuestionEditModal({ question, taskId, opened, onClose }: { question: { id: number; content: string }; taskId?: string; opened: boolean; onClose: () => void }) {
  const client = useQueryClient();
  const [content, setContent] = useState(question.content);
  useEffect(() => setContent(question.content), [question]);
  const edit = useMutation({ mutationFn: () => questionApi.update(question.id, { content }), onSuccess: () => {
    client.invalidateQueries({ queryKey: ["questions"] });
    if (taskId) client.invalidateQueries({ queryKey: ["task", taskId] });
    onClose();
  }});

  return <Modal opened={opened} onClose={onClose} title="Edit question"><Stack>
    <Textarea value={content} onChange={(event) => setContent(event.currentTarget.value)} label="Question" />
    {edit.error && <ErrorBox error={edit.error} />}
    <Group justify="flex-end"><Button variant="light" onClick={onClose}>Cancel</Button><Button onClick={() => edit.mutate()} loading={edit.isPending} disabled={!content.trim()}>Save</Button></Group>
  </Stack></Modal>;
}

export function RelatedQuestionMemberActions({ question, taskId }: { question: { id: number }; taskId: string }) {
  const client = useQueryClient();
  const remove = useMutation({ mutationFn: () => questionApi.remove(question.id), onSuccess: () => {
    client.invalidateQueries({ queryKey: ["task", taskId] });
    client.invalidateQueries({ queryKey: ["questions"] });
  }});
  return <Button color="red" variant="subtle" size="xs" onClick={(event) => { event.stopPropagation(); remove.mutate(); }} loading={remove.isPending} aria-label="Delete question" title="Delete question">×</Button>;
}
