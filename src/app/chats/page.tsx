import { BottomNav } from "@/components/BottomNav";
import { ChatList } from "@/components/ChatList";
import { getConversationsForUser } from "@/lib/conversations";
import { getServerAuthenticatedUser } from "@/lib/authGuards";

export default async function ChatsPage() {
  const user = await getServerAuthenticatedUser();
  const conversations = await getConversationsForUser(user.id);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-24 pt-6">
      <header className="mb-6">
        <p className="text-sm font-medium text-rose-500">Shake Match</p>
        <h1 className="text-2xl font-bold text-gray-900">チャット</h1>
      </header>
      <ChatList conversations={conversations} />
      <BottomNav />
    </div>
  );
}
