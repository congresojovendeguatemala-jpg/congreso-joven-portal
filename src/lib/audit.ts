import "server-only";
import { db, schema as s } from "@/db";

export async function audit(userId: string | null, action: string, entity: string, entityId?: string | number, detail?: unknown) {
  await db.insert(s.auditLog).values({
    userId,
    action,
    entity,
    entityId: entityId != null ? String(entityId) : null,
    detail: detail ?? null,
  });
}
