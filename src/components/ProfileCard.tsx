import type { NearbyUser } from "@/lib/types";

interface ProfileCardProps {
  user: NearbyUser;
  onLike?: (userId: string) => void;
  onMessage?: (userId: string) => void;
}

export function ProfileCard({ user, onLike, onMessage }: ProfileCardProps) {
  return (
    <article className="flex w-[min(85vw,320px)] shrink-0 snap-center flex-col overflow-hidden rounded-3xl bg-white shadow-xl shadow-rose-100/80 ring-1 ring-rose-100">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-rose-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user.photoUrl}
          alt={`${user.nickname}のプロフィール写真`}
          className="h-full w-full object-cover"
        />
        <span className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {user.distanceLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {user.nickname}
            <span className="ml-2 text-base font-normal text-gray-500">
              {user.age}歳
            </span>
          </h3>
        </div>

        <dl className="space-y-2 text-sm text-gray-600">
          {user.spotMeText && (
            <div>
              <dt className="font-medium text-gray-800">Spot me</dt>
              <dd>{user.spotMeText}</dd>
            </div>
          )}
          <div>
            <dt className="font-medium text-gray-800">好きなご飯</dt>
            <dd>{user.favoriteFood}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-800">普段の遊び方</dt>
            <dd>{user.hobbies}</dd>
          </div>
        </dl>

        <div className="mt-auto flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => onLike?.(user.id)}
            className="flex-1 rounded-full border-2 border-rose-400 bg-white py-3 text-sm font-semibold text-rose-500 transition hover:bg-rose-50 active:scale-[0.98]"
          >
            いいね
          </button>
          <button
            type="button"
            onClick={() => onMessage?.(user.id)}
            className="flex-1 rounded-full bg-gradient-to-r from-rose-400 to-orange-400 py-3 text-sm font-semibold text-white shadow-md shadow-rose-200 transition hover:brightness-105 active:scale-[0.98]"
          >
            メッセージ
          </button>
        </div>
      </div>
    </article>
  );
}
