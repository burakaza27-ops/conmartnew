import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { getChatRoomAction } from "@/app/actions/marketplace";
import { ChatThread } from "@/components/chat/chat-thread";

export default async function SellerChatRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  await requireRole(["SELLER", "ADMIN"], "/seller/messages");
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
