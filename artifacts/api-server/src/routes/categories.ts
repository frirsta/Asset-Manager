import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, categoriesTable, contactsTable } from "@workspace/db";
import {
  GetCategoryParams,
  GetCategoryResponse,
  UpdateCategoryParams,
  UpdateCategoryBody,
  UpdateCategoryResponse,
  DeleteCategoryParams,
  CreateCategoryBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/categories", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rows = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      color: categoriesTable.color,
      createdAt: categoriesTable.createdAt,
      contactCount: sql<number>`cast(count(${contactsTable.id}) as int)`,
    })
    .from(categoriesTable)
    .leftJoin(
      contactsTable,
      eq(contactsTable.categoryId, categoriesTable.id),
    )
    .where(eq(categoriesTable.userId, req.user.id))
    .groupBy(categoriesTable.id)
    .orderBy(categoriesTable.name);

  res.json(rows);
});

router.post("/categories", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [cat] = await db
    .insert(categoriesTable)
    .values({ ...parsed.data, userId: req.user.id })
    .returning();

  res.status(201).json({ ...cat, contactCount: 0 });
});

router.get("/categories/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      color: categoriesTable.color,
      createdAt: categoriesTable.createdAt,
      contactCount: sql<number>`cast(count(${contactsTable.id}) as int)`,
    })
    .from(categoriesTable)
    .leftJoin(
      contactsTable,
      eq(contactsTable.categoryId, categoriesTable.id),
    )
    .where(eq(categoriesTable.id, params.data.id))
    .groupBy(categoriesTable.id);

  if (!row || (row as any).userId !== req.user.id) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.json(GetCategoryResponse.parse(row));
});

router.patch("/categories/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UpdateCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.id, params.data.id));

  if (!existing[0] || existing[0].userId !== req.user.id) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  const [cat] = await db
    .update(categoriesTable)
    .set(parsed.data)
    .where(eq(categoriesTable.id, params.data.id))
    .returning();

  res.json(UpdateCategoryResponse.parse({ ...cat, contactCount: 0 }));
});

router.delete("/categories/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeleteCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.id, params.data.id));

  if (!existing[0] || existing[0].userId !== req.user.id) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  await db
    .delete(categoriesTable)
    .where(eq(categoriesTable.id, params.data.id));

  res.sendStatus(204);
});

export default router;
