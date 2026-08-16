import { Button, Card, FileButton, Group, Modal, Text } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { questionApi, taskApi } from "../api";
import { Photo, Task, User } from "../types";
import { ErrorBox } from "./feedback";

export function TaskPhotos({ task, user }: { task: Task; user: Pick<User, "role"> }) {
  const client = useQueryClient();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const upload = useMutation({ mutationFn: (file: File) => taskApi.upload(task.id, file), onSuccess: () => client.invalidateQueries({ queryKey: ["task", String(task.id)] }) });
  const remove = useMutation({ mutationFn: (photoId: number) => taskApi.removePhoto(task.id, photoId), onSuccess: () => client.invalidateQueries({ queryKey: ["task", String(task.id)] }) });

  return <Card withBorder mt="xl">
    <Text fw={600}>Photos {task.photoRequired && "(required)"}</Text>
    {(upload.error || remove.error) && <ErrorBox error={upload.error ?? remove.error} />}
    <Group mt="md">{task.photos.map((photo) => <div key={photo.id} className="task-photo">
      <button type="button" className="photo-preview-button" onClick={() => setSelectedPhoto(photo.filePath)}><img src={photo.filePath} alt="Completion proof" /></button>
      <Button color="red" variant="subtle" size="xs" onClick={() => remove.mutate(photo.id)} loading={remove.isPending}>Delete</Button>
    </div>)}</Group>
    {!task.photos.length && <Text size="sm" c="dimmed" mt="sm">No completion photos uploaded.</Text>}
    {user.role === "member" && <FileButton onChange={(file) => file && upload.mutate(file)} accept="image/*">{(props) => <Button {...props} mt="sm" loading={upload.isPending}>Upload proof photo</Button>}</FileButton>}
    <Modal opened={!!selectedPhoto} onClose={() => setSelectedPhoto(null)} title="Completion photo" size="lg"><img className="expanded-photo" src={selectedPhoto ?? ""} alt="Expanded completion proof" /></Modal>
  </Card>;
}

export function QuestionPhotos({ photos }: { photos: Photo[] }) {
  const client = useQueryClient();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const remove = useMutation({ mutationFn: questionApi.removePhoto, onSuccess: () => {
    client.invalidateQueries({ queryKey: ["questions"] });
    client.invalidateQueries({ queryKey: ["task"] });
  }});

  if (!photos.length) return null;
  return <>
    <div onClick={(event) => event.stopPropagation()}>
      <Group mt="sm">{photos.map((photo) => <div key={photo.id} className="task-photo">
        <button type="button" className="photo-preview-button" onClick={() => setSelectedPhoto(photo.filePath)}><img src={photo.filePath} alt="Question attachment" /></button>
        <button
          type="button"
          className="question-photo-delete"
          onClick={() => remove.mutate(photo.id)}
          disabled={remove.isPending}
          aria-label="Delete question photo"
          title="Delete question photo"
        >
          ×
        </button>
      </div>)}</Group>
      {remove.error && <ErrorBox error={remove.error} />}
    </div>
    <Modal opened={!!selectedPhoto} onClose={() => setSelectedPhoto(null)} title="Question photo" size="lg"><img className="expanded-photo" src={selectedPhoto ?? ""} alt="Expanded question attachment" /></Modal>
  </>;
}
