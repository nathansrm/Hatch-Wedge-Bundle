import * as React from "react";
import Layout from "./components/Layout";
import { appConfig } from "@/lib/config";
import { formatDistanceToNow } from "date-fns";
import { Button, Html, Text } from "react-email";

interface InvitationEmailProps {
  workspaceName: string;
  inviterName: string;
  /** Invitation role label (defaults to `"member"` if omitted). */
  role?: string;
  acceptUrl: string;
  expiresAt: Date;
}

export default function InvitationEmail({
  workspaceName,
  inviterName,
  role,
  acceptUrl,
  expiresAt,
}: InvitationEmailProps) {
  const roleLabel = String(role ?? "member").toLowerCase();

  return (
    <Html>
      <Layout previewText={`Join ${workspaceName} on ${appConfig.projectName} 🎉`}>
        <Text>Hello! 👋</Text>

        <Text>
          {inviterName} has invited you to join their workspace{" "}
          <strong>{workspaceName}</strong> on {appConfig.projectName} as a{" "}
          {roleLabel}.
        </Text>

        <Text>Click the button below to accept the invitation:</Text>

        <Button
          href={acceptUrl}
          className="bg-primary text-primary-foreground rounded-md py-2 px-4 mt-4"
        >
          Accept Invitation
        </Button>

        <Text className="text-muted text-[14px] mt-4">
          This invitation will expire{" "}
          {formatDistanceToNow(new Date(expiresAt), { addSuffix: true })}. If you
          weren&apos;t expecting this invitation, you can safely ignore it.
        </Text>
      </Layout>
    </Html>
  );
} 