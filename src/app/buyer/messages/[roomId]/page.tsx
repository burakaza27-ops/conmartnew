import { notFound, redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { getChatRoomAction } from "@/app/actions/marketplace";
import { ChatThread } from "@/components/chat/chat-thread";

export default async function BuyerChatRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const user = await requireRole(["BUYER", "FIELD_AGENT", "ADMIN"], "/buyer/messages");

  if (user.role === "FIELD_AGENT") {
    const { roomId } = await params;
    redirect(`/agent/messages/${roomId}`);
  }

  const { roomId } = await params;
  const result = await getChatRoomAction(roomId);
  if (!result.success) {
    notFound();
  }

  return (
    <ChatThread
      roomId={result.data.id}
      type={result.data.type}
      counterpartName={result.data.counterpartName}
      listingTitle={result.data.listingTitle}
      messages={result.data.messages}
      ticket={result.data.ticket}
    />
  );
}
