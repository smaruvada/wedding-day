import { Button, Group, Modal, Stack, Textarea } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
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

export function RelatedQuestionMemberActions({ question, taskId }: { question: { id: number; status: "open" | "resolved" }; taskId: string }) {
  const client = useQueryClient();
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const remove = useMutation({ mutationFn: () => questionApi.remove(question.id), onSuccess: () => {
    client.invalidateQueries({ queryKey: ["task", taskId] });
    client.invalidateQueries({ queryKey: ["questions"] });
    setDeleteConfirmationOpen(false);
  }});
  if (question.status !== "open") return null;
  return <>
    <Button color="red" variant="subtle" size="xs" onClick={(event) => { event.stopPropagation(); setDeleteConfirmationOpen(true); }} aria-label="Delete question" title="Delete question"><IconTrash size={16} stroke={1.8} /></Button>
    <Modal opened={deleteConfirmationOpen} onClose={() => setDeleteConfirmationOpen(false)} title="Delete question?">
      <Stack>
        <div>Are you sure you want to permanently delete this question?</div>
        {remove.error && <ErrorBox error={remove.error} />}
        <Group justify="flex-end">
          <Button variant="light" onClick={() => setDeleteConfirmationOpen(false)} disabled={remove.isPending}>Cancel</Button>
          <Button color="red" onClick={() => remove.mutate()} loading={remove.isPending}>Delete question</Button>
        </Group>
      </Stack>
    </Modal>
  </>;
}
