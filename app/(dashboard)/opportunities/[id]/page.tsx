import { notFound } from "next/navigation";

import { getOpportunityDetail } from "@/db/queries/opportunities";
import { OpportunityDetailView } from "@/features/opportunities/opportunity-detail";
import { auth } from "@/lib/auth/auth";
import { canEditOpportunity } from "@/lib/permissions/roles";

type OpportunityDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OpportunityDetailPage({
  params,
}: OpportunityDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const { id } = await params;

  const opportunity = await getOpportunityDetail({
    organizationId: session.user.organizationId,
    role: session.user.role,
    userId: session.user.id,
    id,
  });

  if (!opportunity) {
    notFound();
  }

  const canEdit =
    canEditOpportunity(session.user.role) ||
    (session.user.role === "seller" &&
      opportunity.owner?.id === session.user.id);

  return (
    <OpportunityDetailView canEdit={canEdit} opportunity={opportunity} />
  );
}
