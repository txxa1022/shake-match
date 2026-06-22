import type { NearbyUser } from "@/lib/types";
import { ProfileCard } from "./ProfileCard";

interface ProfileCardCarouselProps {
  users: NearbyUser[];
  onLike?: (userId: string) => void;
  onMessage?: (userId: string) => void;
}

export function ProfileCardCarousel({
  users,
  onLike,
  onMessage,
}: ProfileCardCarouselProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-3xl bg-white/80 px-6 py-10 text-center shadow-lg ring-1 ring-rose-100">
        <p className="text-lg font-semibold text-gray-800">
          近くに該当するユーザーがいません
        </p>
        <p className="mt-2 text-sm text-gray-500">
          絞り込み条件を緩めるか、別の場所で試してみてください
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden">
      <p className="mb-4 text-center text-sm font-medium text-rose-600">
        {users.length}人が近くにいます
      </p>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {users.map((user) => (
          <ProfileCard
            key={user.id}
            user={user}
            onLike={onLike}
            onMessage={onMessage}
          />
        ))}
      </div>
    </div>
  );
}
