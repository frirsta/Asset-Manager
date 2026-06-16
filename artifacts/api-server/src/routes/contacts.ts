import { Router, type IRouter } from "express";
import { eq, and, ilike, sql, inArray } from "drizzle-orm";
import { db, contactsTable, categoriesTable } from "@workspace/db";
import {
  ListContactsQueryParams,
  CreateContactBody,
  GetContactParams,
  UpdateContactParams,
  UpdateContactBody,
  DeleteContactParams,
  BulkDeleteContactsBody,
} from "@workspace/api-zod";
import { emailsTable, campaignsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/contacts", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const query = ListContactsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { categoryId, status, search, page, limit } = query.data;
  const offset = (page - 1) * limit;

  const conditions = [eq(contactsTable.userId, req.user.id)];
  if (categoryId) {
    conditions.push(eq(contactsTable.categoryId, categoryId));
  }
  if (status) {
    conditions.push(
      eq(contactsTable.status, status as "pending" | "sent" | "failed"),
    );
  }
  if (search) {
    conditions.push(
      sql`(${ilike(contactsTable.companyName, `%${search}%`)} or ${ilike(contactsTable.email, `%${search}%`)} or ${ilike(contactsTable.contactName, `%${search}%`)})`,
    );
  }

  const [{ total }] = await db
    .select({ total: sql<number>`cast(count(*) as int)` })
    .from(contactsTable)
    .where(and(...conditions));

  const contacts = await db
    .select({
      id: contactsTable.id,
      companyName: contactsTable.companyName,
      contactName: contactsTable.contactName,
      email: contactsTable.email,
      website: contactsTable.website,
      industry: contactsTable.industry,
      categoryId: contactsTable.categoryId,
      categoryName: categoriesTable.name,
      city: contactsTable.city,
      country: contactsTable.country,
      phone: contactsTable.phone,
      notes: contactsTable.notes,
      status: contactsTable.status,
      createdAt: contactsTable.createdAt,
    })
    .from(contactsTable)
    .leftJoin(
      categoriesTable,
      eq(categoriesTable.id, contactsTable.categoryId),
    )
    .where(and(...conditions))
    .orderBy(contactsTable.companyName)
    .limit(limit)
    .offset(offset);

  res.json({ contacts, total, page, limit });
});

router.post("/contacts", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [contact] = await db
    .insert(contactsTable)
    .values({ ...parsed.data, userId: req.user.id })
    .returning();

  res.status(201).json({ ...contact, categoryName: null });
});

router.post("/contacts/bulk-delete", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = BulkDeleteContactsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.ids.length === 0) {
    res.json({ deleted: 0 });
    return;
  }

  const deleted = await db
    .delete(contactsTable)
    .where(
      and(
        inArray(contactsTable.id, parsed.data.ids),
        eq(contactsTable.userId, req.user.id),
      ),
    )
    .returning();

  res.json({ deleted: deleted.length });
});

router.get("/contacts/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetContactParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [contact] = await db
    .select({
      id: contactsTable.id,
      companyName: contactsTable.companyName,
      contactName: contactsTable.contactName,
      email: contactsTable.email,
      website: contactsTable.website,
      industry: contactsTable.industry,
      categoryId: contactsTable.categoryId,
      categoryName: categoriesTable.name,
      city: contactsTable.city,
      country: contactsTable.country,
      phone: contactsTable.phone,
      notes: contactsTable.notes,
      status: contactsTable.status,
      createdAt: contactsTable.createdAt,
    })
    .from(contactsTable)
    .leftJoin(
      categoriesTable,
      eq(categoriesTable.id, contactsTable.categoryId),
    )
    .where(eq(contactsTable.id, params.data.id));

  if (!contact || (contact as any).userId !== req.user.id) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }

  const emails = await db
    .select({
      id: emailsTable.id,
      campaignId: emailsTable.campaignId,
      campaignName: campaignsTable.name,
      contactId: emailsTable.contactId,
      contactEmail: contactsTable.email,
      contactCompany: contactsTable.companyName,
      status: emailsTable.status,
      errorMessage: emailsTable.errorMessage,
      sentAt: emailsTable.sentAt,
    })
    .from(emailsTable)
    .leftJoin(campaignsTable, eq(campaignsTable.id, emailsTable.campaignId))
    .where(eq(emailsTable.contactId, params.data.id))
    .orderBy(sql`${emailsTable.sentAt} desc`);

  res.json({ contact, emails });
});

router.patch("/contacts/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UpdateContactParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(contactsTable)
    .where(eq(contactsTable.id, params.data.id));

  if (!existing[0] || existing[0].userId !== req.user.id) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }

  const [contact] = await db
    .update(contactsTable)
    .set(parsed.data)
    .where(eq(contactsTable.id, params.data.id))
    .returning();

  res.json({ ...contact, categoryName: null });
});

router.delete("/contacts/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeleteContactParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(contactsTable)
    .where(eq(contactsTable.id, params.data.id));

  if (!existing[0] || existing[0].userId !== req.user.id) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }

  await db
    .delete(contactsTable)
    .where(eq(contactsTable.id, params.data.id));

  res.sendStatus(204);
});

export default router;
