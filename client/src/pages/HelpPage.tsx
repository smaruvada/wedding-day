import { Card, List, Stack, Text, Title } from "@mantine/core";
import { Layout } from "../components/Layout";
import { useAuthStore } from "../store";

export function HelpPage() {
  const user = useAuthStore((state) => state.user)!;
  const viewMode = useAuthStore((state) => state.viewMode);
  const isHostView = user.role !== "member" && viewMode === "host";

  return (
    <Layout>
      <Stack gap="lg">
        <div>
          <Title className="list-page-heading">Help</Title>
          <Text c="dimmed" mt="xs">
            A quick guide to managing tasks and questions for the wedding.
          </Text>
        </div>

        <Card withBorder>
          <Title order={2}>Tasks</Title>
          {isHostView ? (
            <List mt="sm" spacing="xs">
              <List.Item>Open <strong>Tasks</strong> to see every task. Use Filters to narrow the list by status or urgency.</List.Item>
              <List.Item>Use the <strong>+</strong> button to create one task or add a task list from text or a spreadsheet.</List.Item>
              <List.Item>When creating a task, add a title, optional description and items, choose an urgency, assign it to a member, and optionally require a completion photo.</List.Item>
              <List.Item>Open a task to change its assignee, edit its details and items, or delete it. You can also see any completion photos and related questions there.</List.Item>
              <List.Item>Use the account menu to switch to member view and see the experience your wedding party has.</List.Item>
            </List>
          ) : (
            <List mt="sm" spacing="xs">
              <List.Item>Open <strong>Tasks</strong> to see the tasks assigned to you. Select a task card to view its details.</List.Item>
              <List.Item>Complete each item by selecting its checkbox. When all items are completed, the task is marked complete.</List.Item>
              <List.Item>If a task requires a completion photo, upload proof from the Photos section. You can also view or remove photos you uploaded.</List.Item>
              <List.Item>Use the urgency badge and completion status to decide what needs attention first.</List.Item>
            </List>
          )}
        </Card>

        <Card withBorder>
          <Title order={2}>Questions</Title>
          {isHostView ? (
            <List mt="sm" spacing="xs">
              <List.Item>Open <strong>Questions</strong> to review questions from members. The number beside Questions shows how many are open.</List.Item>
              <List.Item>Questions can include a related task, an urgency level, and photo attachments. Open the related task when you need more context.</List.Item>
              <List.Item>Write an answer and select <strong>Answer</strong> to resolve a question. Open a resolved question to update the answer or mark it open again.</List.Item>
              <List.Item>Urgency can be adjusted as priorities change.</List.Item>
            </List>
          ) : (
            <List mt="sm" spacing="xs">
              <List.Item>Use <strong>Questions</strong> and select <strong>Ask host</strong> when you need help with an assigned task.</List.Item>
              <List.Item>Choose the related task, describe your question, set its urgency, and optionally attach a photo before sending it.</List.Item>
              <List.Item>Your open questions appear on the Questions page and in the related task. You can edit or delete them while they are yours.</List.Item>
              <List.Item>When a host answers, the answer appears with the question and its status changes to resolved.</List.Item>
            </List>
          )}
        </Card>

        {user.role === "admin" && (
          <Card withBorder>
            <Title order={2}>User management</Title>
            <List mt="sm" spacing="xs">
              <List.Item>Open <strong>Users</strong> in the main navigation to view every account, including its ID, name, email or username, role, role type, event, and creation date.</List.Item>
              <List.Item>Select <strong>+</strong> to create an account. Enter a name, email or username, and a password of at least 8 characters containing an uppercase letter, number, and special character. New accounts can be created as members or hosts, with an optional wedding-party role type.</List.Item>
              <List.Item>Select <strong>Edit</strong> beside an account to update its name, email or username, role, role type, or password. Passwords are never shown; enter a new password only when you want to reset it.</List.Item>
              <List.Item>Administrators can assign member, host, or admin roles when editing other accounts. You cannot change your own role.</List.Item>
              <List.Item>Select <strong>Delete</strong> and confirm to permanently remove another account. You cannot delete your own account; that person&apos;s existing tasks, questions, and photos are kept.</List.Item>
            </List>
          </Card>
        )}
      </Stack>
    </Layout>
  );
}
