import { Button, Group, Modal, Select, Stack, Table, Text, TextInput, Title } from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { adminApi } from "../api";
import { ErrorBox, Loading } from "../components/feedback";
import { Layout } from "../components/Layout";
import { User } from "../types";

type AdminUser = User & { createdAt: string };
const roleTypes = ["bride", "maid_of_honor", "planner", "other"];

function UserForm({ user, onClose }: { user?: AdminUser; onClose: () => void }) {
  const client = useQueryClient();
  const [role, setRole] = useState(user?.role ?? "member");
  const mutation = useMutation({
    mutationFn: (payload: object) => user ? adminApi.updateUser(user.id, payload) : adminApi.createUser(payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate({
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password") || undefined,
      role,
      roleType: form.get("roleType") || null,
    });
  };
  return <form onSubmit={submit}><Stack>
    <TextInput required name="name" label="Name" defaultValue={user?.name} />
    <TextInput required name="email" label="Email or username" defaultValue={user?.email} />
    <TextInput required={!user} name="password" type="password" label={user ? "New password (optional)" : "Password"} minLength={8} description="At least 8 characters, with an uppercase letter, number, and special character" />
    <Select name="role" label="Role" value={role} onChange={(value) => setRole((value ?? "member") as User["role"])} data={user ? ["member", "host", "admin"] : ["member", "host"]} />
    <Select clearable name="roleType" label="Role type" defaultValue={user?.roleType ?? undefined} data={roleTypes} />
    {mutation.error && <ErrorBox error={mutation.error} />}
    <Group justify="flex-end"><Button variant="light" onClick={onClose}>Cancel</Button><Button type="submit" loading={mutation.isPending}>{user ? "Save changes" : "Create user"}</Button></Group>
  </Stack></form>;
}

export function AdminUsersPage() {
  const query = useQuery({ queryKey: ["admin-users"], queryFn: adminApi.users });
  const [editing, setEditing] = useState<AdminUser | null | undefined>(undefined);
  if (query.isLoading) return <Layout><Loading /></Layout>;
  if (query.error) return <Layout><ErrorBox error={query.error} /></Layout>;
  const users = query.data?.users ?? [];
  return <Layout>
    <Group justify="space-between" mb="lg"><Title>Users</Title><Button onClick={() => setEditing(null)}>Create user</Button></Group>
    <Text size="sm" c="dimmed" mb="md">Manage every user account and its attributes. Passwords are never displayed; set a new one to reset it.</Text>
    <Table striped highlightOnHover withTableBorder>
      <Table.Thead><Table.Tr><Table.Th>ID</Table.Th><Table.Th>Name</Table.Th><Table.Th>Email / username</Table.Th><Table.Th>Role</Table.Th><Table.Th>Role type</Table.Th><Table.Th>Event</Table.Th><Table.Th>Created</Table.Th><Table.Th /></Table.Tr></Table.Thead>
      <Table.Tbody>{users.map((user) => <Table.Tr key={user.id}><Table.Td>{user.id}</Table.Td><Table.Td>{user.name}</Table.Td><Table.Td>{user.email}</Table.Td><Table.Td>{user.role}</Table.Td><Table.Td>{user.roleType ?? "—"}</Table.Td><Table.Td>{user.eventId}</Table.Td><Table.Td>{new Date(user.createdAt).toLocaleDateString()}</Table.Td><Table.Td><Button size="xs" variant="light" onClick={() => setEditing(user)}>Edit</Button></Table.Td></Table.Tr>)}</Table.Tbody>
    </Table>
    <Modal opened={editing !== undefined} onClose={() => setEditing(undefined)} title={editing ? `Edit ${editing.name}` : "Create user"}>
      <UserForm user={editing ?? undefined} onClose={() => setEditing(undefined)} />
    </Modal>
  </Layout>;
}
