import { ChatThread } from "@/components/ChatThread";

interface ChatPageProps {
  params: Promise<{ userId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { userId } = await params;

  return (
    <div className="mx-auto flex h-dvh w-full max-w-lg flex-col bg-[#fff7f9]">
      <ChatThread partnerId={userId} />
    </div>
  );
}
