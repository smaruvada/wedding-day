import { ActionIcon, Alert, Button, Card, Group, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { authApi } from "../api";
import { Layout } from "../components/Layout";
import { useAuthStore } from "../store";

export function ProfilePage() {
  const user = useAuthStore((state) => state.user)!;
  const token = useAuthStore((state) => state.token)!;
  const setAuth = useAuthStore((state) => state.setAuth);
  const [success, setSuccess] = useState("");
  const [editingName, setEditingName] = useState(false);
  const nameMutation = useMutation({
    mutationFn: (name: string) => authApi.updateProfile({ name }),
    onSuccess: ({ user: updatedUser }) => {
      setAuth(token, updatedUser);
      setEditingName(false);
    },
  });
  const passwordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => authApi.changePassword(currentPassword, newPassword),
    onSuccess: () => setSuccess("Password updated."),
  });
  const submitPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    if (newPassword !== form.get("confirmPassword")) {
      passwordMutation.reset();
      setSuccess("Passwords do not match.");
      return;
    }
    setSuccess("");
    passwordMutation.mutate({
      currentPassword: String(form.get("currentPassword") ?? ""),
      newPassword,
    });
  };
  return (
    <Layout>
      <Title mb="lg">Profile</Title>
      <Card withBorder maw={520}>
        <Stack gap="sm">
          {editingName ? (
            <form onSubmit={(event) => { event.preventDefault(); const name = String(new FormData(event.currentTarget).get("name") ?? "").trim(); if (name) nameMutation.mutate(name); }}>
              <TextInput
                autoFocus
                required
                name="name"
                label="Name"
                defaultValue={user.name}
                rightSection={<ActionIcon type="submit" variant="light" loading={nameMutation.isPending} aria-label="Save name" title="Save name">✓</ActionIcon>}
              />
              {nameMutation.error && <Alert color="red" mt="sm">Unable to update name</Alert>}
            </form>
          ) : (
            <Group justify="space-between" wrap="nowrap">
              <div role="button" tabIndex={0} style={{ cursor: "pointer", flex: 1 }} onClick={() => setEditingName(true)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setEditingName(true); } }}>
                <Text size="sm" c="dimmed">Name</Text><Text>{user.name}</Text>
              </div>
              <ActionIcon variant="subtle" aria-label="Edit name" title="Edit name" onClick={() => setEditingName(true)}>✎</ActionIcon>
            </Group>
          )}
          <div><Text size="sm" c="dimmed">Email or username</Text><Text>{user.email}</Text></div>
          <div><Text size="sm" c="dimmed">Role</Text><Text tt="capitalize">{user.role}{user.hostType ? ` (${user.hostType.replace(/_/g, " ")})` : ""}</Text></div>
        </Stack>
      </Card>
      <Card withBorder maw={520} mt="lg">
        <Title order={3} mb="md">Change password</Title>
        <form onSubmit={submitPassword}>
          <Stack>
            <PasswordInput required name="currentPassword" label="Current password" />
            <PasswordInput required name="newPassword" label="New password" minLength={8} />
            <PasswordInput required name="confirmPassword" label="Confirm new password" minLength={8} />
            {passwordMutation.error && <Alert color="red">{(passwordMutation.error as any).response?.data?.error ?? "Unable to update password"}</Alert>}
            {success && <Alert color={success === "Password updated." ? "green" : "red"}>{success}</Alert>}
            <Group justify="flex-end"><Button type="submit" loading={passwordMutation.isPending}>Update password</Button></Group>
          </Stack>
        </form>
      </Card>
    </Layout>
  );
}
