import { Button, FileButton, Group, Menu, Modal, Select, SimpleGrid, Stack, Text, Textarea, Title } from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { taskApi } from "../api";
import { EmptyState, ErrorBox, Loading } from "../components/feedback";
import { Layout } from "../components/Layout";
import { TaskCard } from "../components/TaskCard";

function TaskCreationMenu({ onImport }: { onImport: () => void }) {
  return (
    <Menu shadow="md" width={180}>
      <Menu.Target>
        <Button>+</Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item component={Link} to="/host/tasks/new">
          Create task
        </Menu.Item>
        <Menu.Item onClick={onImport}>Add task list</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

function BulkTaskImportModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [taskList, setTaskList] = useState("");
  const mutation = useMutation({
    mutationFn: taskApi.import,
    onSuccess: () => {
      setTaskList("");
      onClose();
      client.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
  const handleFile = async (file: File | null) => {
    if (file) setTaskList(await file.text());
  };
  const titles = taskList
    .split(/\r?\n/)
    .map((title) => title.trim())
    .filter(Boolean);
  return (
    <Modal opened={opened} onClose={onClose} title="Add a task list">
      <Stack>
        <Text size="sm" c="dimmed">
          Add one task per line. Every task is created unassigned.
        </Text>
        <Textarea
          value={taskList}
          onChange={(event) => setTaskList(event.currentTarget.value)}
          label="Task list"
          placeholder={"Confirm florist\nPack emergency kit\nSet out place cards"}
          minRows={8}
        />
        <FileButton onChange={handleFile} accept="text/plain,.txt">
          {(props) => <Button {...props} variant="light">Upload text file</Button>}
        </FileButton>
        {mutation.error && <ErrorBox error={mutation.error} />}
        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!titles.length}
            loading={mutation.isPending}
            onClick={() => mutation.mutate(titles)}
          >
            Create {titles.length || ""} task{titles.length === 1 ? "" : "s"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export function TaskListPage({ host = false }: { host?: boolean }) {
  const query = useQuery({ queryKey: ["tasks"], queryFn: taskApi.list });
  const [status, setStatus] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorBox error={query.error} />;

  const tasks = (query.data?.tasks ?? []).filter(
    (task) => (!status || task.status === status) && (!urgency || task.urgency === urgency),
  );
  const taskCreationMenu = () => (
    <TaskCreationMenu onImport={() => setImportOpen(true)} />
  );

  return <Layout>
    <Group justify="space-between" mb="lg">
      <Title>{host ? "All Tasks" : "My Tasks"}</Title>
      {host && <Group gap="xs"><Button variant="light" onClick={() => setFiltersOpen((current) => !current)} aria-expanded={filtersOpen}>Filters</Button>{taskCreationMenu()}</Group>}
    </Group>
    {host && filtersOpen && <Group mb="md">
      <Select placeholder="Status" clearable data={["open", "completed"]} value={status} onChange={setStatus} />
      <Select placeholder="Urgency" clearable data={["low", "medium", "high", "urgent"]} value={urgency} onChange={setUrgency} />
    </Group>}
    {tasks.length ? <SimpleGrid cols={{ base: 1, sm: 2 }}>{tasks.map((task) => <TaskCard key={task.id} task={task} host={host} />)}</SimpleGrid> :
      <EmptyState message={host ? "No tasks yet." : "No tasks assigned yet."} action={host ? taskCreationMenu() : <Button component={Link} to="/me/questions">Ask a question</Button>} />}
    <BulkTaskImportModal opened={importOpen} onClose={() => setImportOpen(false)} />
  </Layout>;
}
