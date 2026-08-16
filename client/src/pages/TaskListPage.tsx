import { Anchor, Button, FileButton, Group, Menu, Modal, Popover, Select, SimpleGrid, Stack, Text, Textarea, Title } from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { ImportedTask, taskApi } from "../api";
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
  const [spreadsheetTasks, setSpreadsheetTasks] = useState<ImportedTask[] | null>(null);
  const [spreadsheetError, setSpreadsheetError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: taskApi.import,
    onSuccess: () => {
      handleClose();
      client.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
  const handleClose = () => {
    setTaskList("");
    setSpreadsheetTasks(null);
    setSpreadsheetError(null);
    mutation.reset();
    onClose();
  };
  const handleFile = async (file: File | null) => {
    if (file) {
      setSpreadsheetTasks(null);
      setSpreadsheetError(null);
      setTaskList(await file.text());
    }
  };
  const titles = taskList
    .split(/\r?\n/)
    .map((title) => title.trim())
    .filter(Boolean);
  const tasksToImport = spreadsheetTasks ?? titles.map((title) => ({ title }));
  const handleSpreadsheet = async (file: File | null) => {
    if (!file) return;
    try {
      const workbook = XLSX.read(await file.arrayBuffer());
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error("The spreadsheet does not contain a worksheet.");
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });
      const headers = (rows[0] ?? []).map((header) => String(header).trim().toLowerCase());
      const titleIndex = headers.indexOf("title");
      if (titleIndex === -1) throw new Error("The spreadsheet must contain a Title column.");
      const descriptionIndex = headers.indexOf("description");
      const urgencyIndex = headers.indexOf("urgency");
      const imported = rows.slice(1).map((row) => {
        const title = String(row[titleIndex] ?? "").trim();
        const description = String(row[descriptionIndex] ?? "").trim();
        const urgency = String(row[urgencyIndex] ?? "").trim().toLowerCase();
        if (urgency && !["low", "medium", "high", "urgent"].includes(urgency)) {
          throw new Error(`Invalid urgency "${urgency}". Use low, medium, high, or urgent.`);
        }
        return {
          title,
          ...(description && { description }),
          ...(urgency && { urgency: urgency as ImportedTask["urgency"] }),
        };
      }).filter((task) => task.title);
      if (!imported.length) throw new Error("The spreadsheet must contain at least one task title.");
      setTaskList("");
      setSpreadsheetTasks(imported);
      setSpreadsheetError(null);
    } catch (error) {
      setSpreadsheetTasks(null);
      setSpreadsheetError(error instanceof Error ? error.message : "Unable to read the spreadsheet.");
    }
  };
  return (
    <Modal opened={opened} onClose={handleClose} title="Add a task list">
      <Stack>
        <Text size="sm" c="dimmed">
          Add one task per line. Every task is created unassigned.
        </Text>
        <Textarea
          value={taskList}
          onChange={(event) => {
            setSpreadsheetTasks(null);
            setSpreadsheetError(null);
            setTaskList(event.currentTarget.value);
          }}
          label="Task list"
          placeholder={"Confirm florist\nPack emergency kit\nSet out place cards"}
          minRows={8}
        />
        <Group gap="xs" justify="center">
          <FileButton onChange={handleFile} accept="text/plain,.txt">
            {(props) => <Button {...props} variant="light">Upload text file</Button>}
          </FileButton>
          <FileButton onChange={handleSpreadsheet} accept=".xlsx,.xls,.csv">
            {(props) => <Button {...props} variant="light">Upload spreadsheet</Button>}
          </FileButton>
        </Group>
        <Popover width={340} position="bottom-start" withArrow shadow="md">
          <Popover.Target>
            <Anchor component="button" type="button">Spreadsheet format help</Anchor>
          </Popover.Target>
          <Popover.Dropdown>
            <Stack gap="xs">
              <Text size="sm">Upload an Excel or CSV spreadsheet with column headers in the first row.</Text>
              <Text size="sm"><strong>Title</strong> is required. <strong>Description</strong> and <strong>Urgency</strong> are optional.</Text>
              <Text size="sm">Urgency must be one of: low, medium, high, or urgent.</Text>
            </Stack>
          </Popover.Dropdown>
        </Popover>
        {spreadsheetTasks && <Text size="sm">{spreadsheetTasks.length} task{spreadsheetTasks.length === 1 ? "" : "s"} ready to import.</Text>}
        {spreadsheetError && <Text size="sm" c="red">{spreadsheetError}</Text>}
        {mutation.error && <ErrorBox error={mutation.error} />}
        <Group justify="flex-end">
          <Button variant="light" onClick={handleClose}>Cancel</Button>
          <Button
            disabled={!tasksToImport.length}
            loading={mutation.isPending}
            onClick={() => mutation.mutate(tasksToImport)}
          >
            Create {tasksToImport.length || ""} task{tasksToImport.length === 1 ? "" : "s"}
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
