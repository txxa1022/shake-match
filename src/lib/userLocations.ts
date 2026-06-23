import { getSql, isDbConfigured, isUuid } from "./db";

export async function upsertUserLocation(
  userId: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  if (!isDbConfigured() || !isUuid(userId)) return;

  const sql = getSql();
  if (!sql) return;

  await sql`
    select upsert_user_location(
      ${userId}::uuid,
      ${latitude},
      ${longitude}
    )
  `;
}
