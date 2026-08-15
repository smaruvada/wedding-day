import { AppShell, Badge, Button, Container, Group, Menu, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import { questionApi } from "../api";
import { useAuthStore } from "../store";

export function Layout({ children }: { children: ReactNode }) {
  const { user, clear } = useAuthStore();
  const questions = useQuery({
    queryKey: ["questions"],
    queryFn: questionApi.list,
    enabled: !!user,
  });

  if (!user) return <Navigate to="/login" replace />;

  const taskPath = user.role === "host" ? "/host/tasks" : "/me/tasks";
  const openQuestionCount = questions.data?.questions.length ?? 0;

  return (
    <AppShell header={{ height: 62 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" className="app-header-content">
          <Group className="app-primary-nav">
            <Link className="brand-link" to={taskPath}>
              <Title order={3}>
                <span className="brand-full">Wedding Day</span>
                <span className="brand-mobile">W</span>
              </Title>
            </Link>
            <Button component={Link} to={taskPath} variant="subtle">Tasks</Button>
            <Button component={Link} to={user.role === "host" ? "/host/questions" : "/me/questions"} variant="subtle">
              Questions&nbsp; <Badge size="sm" circle>{openQuestionCount}</Badge>
            </Button>
          </Group>
          <Menu position="bottom-end">
            <Menu.Target>
              <Button className="account-menu-button" variant="subtle">{user.name}</Button>
            </Menu.Target>
            <Menu.Dropdown>
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
