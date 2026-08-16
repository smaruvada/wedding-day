import { Alert, Card, Center, Loader, Stack, Text } from "@mantine/core";
import { ReactNode } from "react";

export function ErrorBox({ error }: { error: unknown }) {
  const responseError = (
    error as { response?: { data?: { error?: unknown } } }
  )?.response?.data?.error;

  return (
    <Alert color="red">
      {typeof responseError === "string"
        ? responseError
        : error instanceof Error
          ? error.message
          : "Unable to load data"}
    </Alert>
  );
}

export function Loading() {
  return (
    <Center py="xl">
      <Loader />
    </Center>
  );
}

export function EmptyState({
  message,
  action,
  description = "Start here to keep the wedding day moving smoothly.",
}: {
  message: string;
  action: ReactNode;
  description?: string;
}) {
  return (
    <Card withBorder className="empty-state" role="status">
      <Stack align="center" gap="sm">
        <Text fw={600}>{message}</Text>
        <Text size="sm" c="dimmed" ta="center">
          {description}
        </Text>
        {action}
      </Stack>
    </Card>
  );
}
