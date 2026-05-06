import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
import {
  ListSettingsResponse,
  UpsertSettingBody,
  UpsertSettingResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await db.select().from(settingsTable);
  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  res.json(ListSettingsResponse.parse(map));
});

router.put("/settings/:key", async (req, res): Promise<void> => {
  const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;

  const parsed = UpsertSettingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [setting] = await db
    .insert(settingsTable)
    .values({ key, value: parsed.data.value })
    .onConflictDoUpdate({
      target: settingsTable.key,
      set: { value: parsed.data.value, updatedAt: new Date() },
    })
    .returning();

  res.json(UpsertSettingResponse.parse({ key: setting.key, value: setting.value }));
});

export default router;
