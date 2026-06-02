import * as React from "react";
import Layout from "./components/Layout";
import { appConfig } from "@/lib/config";
import { Html, Text } from "react-email";

interface RoleChangeEmailProps {
  workspaceName: string;
  newRole: string;
  changedByName: string;
}

export default function RoleChangeEmail({
  workspaceName,
  newRole,
  changedByName,
}: RoleChangeEmailProps) {
  return (
    <Html>
      <Layout previewText={`Your role has been updated in ${workspaceName} 🔄`}>
        <Text>Hello! 👋</Text>

        <Text>
          {changedByName} has updated your role in <strong>{workspaceName}</strong>{" "}
          on {appConfig.projectName}. You are now a {newRole.toLowerCase()}.
        </Text>

        <Text>
          If you have any questions about your new role or permissions, please
          contact your workspace administrator.
        </Text>

        <Text className="text-muted text-[14px] mt-4">
          If you believe this change was made in error, please contact your
          workspace administrator immediately.
        </Text>
      </Layout>
    </Html>
  );
} 