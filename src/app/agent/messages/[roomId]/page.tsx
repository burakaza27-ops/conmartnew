import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { getChatRoomAction } from "@/app/actions/marketplace";
import { ChatThread } from "@/components/chat/chat-thread";

export default async function AgentChatRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  await requireRole(["FIELD_AGENT", "ADMIN"], "/agent/messages");
  const { roomId } = await params;
  const result = await getChatRoomAction(roomId);
  if (!result.success) {
    notFound();
  }

  return (
    <ChatThread
      roomId={result.data.id}
      type={result.data.type}
      currentUserId={result.data.viewerId}
      currentUserName={result.data.viewerName}
      currentUserRole={result.data.viewerRole}
      counterpartName={result.data.counterpartName}
      counterpart={result.data.counterpart}
      productContext={result.data.productContext}
      listingTitle={result.data.listingTitle}
      messages={result.data.messages}
      ticket={result.data.ticket}
    />
  );
}
