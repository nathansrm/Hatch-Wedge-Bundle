import { db } from "@/db";
import { organizations } from "@/db/schema/organization";
import { createOrganization } from "./createOrganization";
import { eq } from "drizzle-orm";
import getOrCreateUser from "@/lib/users/getOrCreateUser";

export const getOrCreateOrganizationByPaddleCustomer = async ({
  paddleCustomerId,
  customerEmail,
  customerName,
}: {
  paddleCustomerId: string;
  customerEmail: string;
  customerName?: string | null;
}) => {
  const existingOrg = await db
    .select()
    .from(organizations)
    .where(eq(organizations.paddleCustomerId, paddleCustomerId))
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
      paddleCustomerId,
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

export default getOrCreateOrganizationByPaddleCustomer;
