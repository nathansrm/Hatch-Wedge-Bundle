import { db } from "@/db";
import { organizations } from "@/db/schema/organization";
import { createOrganization } from "./createOrganization";
import { eq } from "drizzle-orm";
import getOrCreateUser from "@/lib/users/getOrCreateUser";

export const getOrCreateOrganizationByPolarCustomer = async ({
  polarCustomerId,
  customerEmail,
  customerName,
}: {
  polarCustomerId: string;
  customerEmail: string;
  customerName?: string | null;
}) => {
  const existingOrg = await db
    .select()
    .from(organizations)
    .where(eq(organizations.polarCustomerId, polarCustomerId))
    .limit(1)
    .then((res) => res[0]);

  if (existingOrg) {
    return {
      organization: existingOrg,
      created: false,
    };
  }

  const { user, created: userCreated } = await getOrCreateUser({
    emailId: customerEmail,
    name: customerName,
  });

  const orgName = customerName
    ? `${customerName}'s Organization`
    : `${customerEmail}'s Organization`;

  const organization = await createOrganization({
    name: orgName,
    userId: user.id,
  });

  const updatedOrg = await db
    .update(organizations)
    .set({
      polarCustomerId,
    })
    .where(eq(organizations.id, organization.id))
    .returning()
    .then((res) => res[0]);

  return {
    organization: updatedOrg,
    created: true,
    userCreated,
  };
};

export default getOrCreateOrganizationByPolarCustomer;
