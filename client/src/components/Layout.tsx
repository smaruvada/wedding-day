import { AppShell, Badge, Button, Container, Group, Menu, Title } from "@mantine/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import { questionApi } from "../api";
import { useAuthStore } from "../store";

export function Layout({ children }: { children: ReactNode }) {
  const { user, clear, viewMode, setViewMode } = useAuthStore();
  const client = useQueryClient();
  const questions = useQuery({
    queryKey: ["questions"],
    queryFn: questionApi.list,
    enabled: !!user,
  });

  if (!user) return <Navigate to="/login" replace />;

  const isHostView = user.role !== "member" && viewMode === "host";
  const taskPath = isHostView ? "/host/tasks" : "/me/tasks";
  const openQuestionCount = questions.data?.questions.length ?? 0;

  return (
    <AppShell header={{ height: 62 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" className="app-header-content">
          <Group className="app-primary-nav">
            <Link className="brand-link" to={taskPath}>
              <Title order={3}>
                <span className="brand-icon">W</span>
                <span className="brand-full">Wedding Day</span>
              </Title>
            </Link>
            <Button component={Link} to={taskPath} variant="subtle">Tasks</Button>
            <Button component={Link} to={isHostView ? "/host/questions" : "/me/questions"} variant="subtle">
              Questions&nbsp; <Badge size="sm" circle>{openQuestionCount}</Badge>
            </Button>
            {user.role === "admin" && <Button component={Link} to="/users" variant="subtle">Users</Button>}
          </Group>
          <Menu position="bottom-end">
            <Menu.Target>
              <Button className="account-menu-button" variant="subtle">{user.name}</Button>
            </Menu.Target>
            <Menu.Dropdown>
              {user.role === "host" && <Menu.Item component={Link} to={isHostView ? "/me/tasks" : "/host/tasks"} onClick={() => { setViewMode(isHostView ? "member" : "host"); client.clear(); }}>
                Switch to {isHostView ? "member" : "host"} view
              </Menu.Item>}
              <Menu.Item component={Link} to="/profile">Profile</Menu.Item>
              <Menu.Item onClick={clear}>Log out</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="lg">{children}</Container>
      </AppShell.Main>
    </AppShell>
  );
}
