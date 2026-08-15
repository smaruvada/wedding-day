import { Button, Group, Select, SimpleGrid, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { taskApi } from "../api";
import { EmptyState, ErrorBox, Loading } from "../components/feedback";
import { Layout } from "../components/Layout";
import { TaskCard } from "../components/TaskCard";

export function TaskListPage({ host = false }: { host?: boolean }) {
  const query = useQuery({ queryKey: ["tasks"], queryFn: taskApi.list });
  const [status, setStatus] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorBox error={query.error} />;

  const tasks = (query.data?.tasks ?? []).filter(
    (task) => (!status || task.status === status) && (!urgency || task.urgency === urgency),
  );
  const createTaskButton = <Button component={Link} to="/host/tasks/new" aria-label="Create task" title="Create task">+</Button>;

  return <Layout>
    <Group justify="space-between" mb="lg">
      <Title>{host ? "All Tasks" : "My Tasks"}</Title>
      {host && <Group gap="xs"><Button variant="light" onClick={() => setFiltersOpen((current) => !current)} aria-expanded={filtersOpen}>Filters</Button>{createTaskButton}</Group>}
    </Group>
    {host && filtersOpen && <Group mb="md">
      <Select placeholder="Status" clearable data={["open", "completed"]} value={status} onChange={setStatus} />
      <Select placeholder="Urgency" clearable data={["low", "medium", "high", "urgent"]} value={urgency} onChange={setUrgency} />
    </Group>}
    {tasks.length ? <SimpleGrid cols={{ base: 1, sm: 2 }}>{tasks.map((task) => <TaskCard key={task.id} task={task} host={host} />)}</SimpleGrid> :
      <EmptyState message={host ? "No tasks yet." : "No tasks assigned yet."} action={host ? createTaskButton : <Button component={Link} to="/me/questions">Ask a question</Button>} />}
  </Layout>;
}
