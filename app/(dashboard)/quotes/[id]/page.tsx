import { notFound } from "next/navigation";

import { getQuote } from "@/db/queries/quotes";
import { QuoteDetail } from "@/features/quotes/quote-detail";
import { auth } from "@/lib/auth/auth";
import { canViewMargin } from "@/lib/permissions/roles";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const { id } = await params;
  const quote = await getQuote({
    organizationId: session.user.organizationId,
    role: session.user.role,
    userId: session.user.id,
    quoteId: id,
  });
  if (!quote) notFound();

  return (
    <QuoteDetail
      quote={quote}
      showFinancials={canViewMargin(session.user.role)}
    />
  );
}
