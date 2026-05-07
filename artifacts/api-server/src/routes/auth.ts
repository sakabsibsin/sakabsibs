import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";

const router: IRouter = Router();

const DEFAULT_ADMIN_PASSWORD = "aurum2024";

router.post("/auth/login", async (req, res): Promise<void> => {
  const { password } = req.body as { password?: string };

  if (!password) {
    res.status(400).json({ error: "Password is required" });
    return;
  }

  const [setting] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.key, "admin_password"));

  const adminPassword = setting?.value ?? DEFAULT_ADMIN_PASSWORD;

  if (password !== adminPassword) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  res.json({ success: true });
});

export default router;
