import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import {
  db,
  campaignsTable,
  categoriesTable,
  contactsTable,
  emailsTable,
} from "@workspace/db";
import {
  CreateCampaignBody,
  GetCampaignParams,
  DeleteCampaignParams,
  SendCampaignParams,
} from "@workspace/api-zod";
import { sendCampaignEmails } from "../lib/email";

const router: IRouter = Router();

async function getCampaignWithStats(campaignId: number, userId: string) {
  const [row] = await db
    .select({
      id: campaignsTable.id,
      userId: campaignsTable.userId,
      name: campaignsTable.name,
      subject: campaignsTable.subject,
      body: campaignsTable.body,
      categoryId: campaignsTable.categoryId,
      categoryName: categoriesTable.name,
      status: campaignsTable.status,
      createdAt: campaignsTable.createdAt,
      sentAt: campaignsTable.sentAt,
      sentCount: sql<number>`cast(count(case when ${emailsTable.status} = 'sent' then 1 end) as int)`,
      failedCount: sql<number>`cast(count(case when ${emailsTable.status} = 'failed' then 1 end) as int)`,
      totalCount: sql<number>`cast(count(${emailsTable.id}) as int)`,
    })
    .from(campaignsTable)
    .leftJoin(
      categoriesTable,
      eq(categoriesTable.id, campaignsTable.categoryId),
    )
    .leftJoin(emailsTable, eq(emailsTable.campaignId, campaignsTable.id))
    .where(
      and(
        eq(campaignsTable.id, campaignId),
        eq(campaignsTable.userId, userId),
      ),
    )
    .groupBy(campaignsTable.id, categoriesTable.name);

  return row ?? null;
}

router.get("/campaigns", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rows = await db
    .select({
      id: campaignsTable.id,
      name: campaignsTable.name,
      subject: campaignsTable.subject,
      body: campaignsTable.body,
      categoryId: campaignsTable.categoryId,
      categoryName: categoriesTable.name,
      status: campaignsTable.status,
      createdAt: campaignsTable.createdAt,
      sentAt: campaignsTable.sentAt,
      sentCount: sql<number>`cast(count(case when ${emailsTable.status} = 'sent' then 1 end) as int)`,
      failedCount: sql<number>`cast(count(case when ${emailsTable.status} = 'failed' then 1 end) as int)`,
      totalCount: sql<number>`cast(count(${emailsTable.id}) as int)`,
    })
    .from(campaignsTable)
    .leftJoin(
      categoriesTable,
      eq(categoriesTable.id, campaignsTable.categoryId),
    )
    .leftJoin(emailsTable, eq(emailsTable.campaignId, campaignsTable.id))
    .where(eq(campaignsTable.userId, req.user.id))
    .groupBy(campaignsTable.id, categoriesTable.name)
    .orderBy(sql`${campaignsTable.createdAt} desc`);

  res.json(rows);
});

router.post("/campaigns", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [campaign] = await db
    .insert(campaignsTable)
    .values({ ...parsed.data, userId: req.user.id })
    .returning();

  res.status(201).json({
    ...campaign,
    categoryName: null,
    sentCount: 0,
    failedCount: 0,
    totalCount: 0,
  });
});

router.get("/campaigns/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const campaign = await getCampaignWithStats(params.data.id, req.user.id);
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
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
    .leftJoin(contactsTable, eq(contactsTable.id, emailsTable.contactId))
    .where(eq(emailsTable.campaignId, params.data.id))
    .orderBy(sql`${emailsTable.sentAt} desc`);

  res.json({ campaign, emails });
});

router.delete("/campaigns/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeleteCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, params.data.id));

  if (!existing[0] || existing[0].userId !== req.user.id) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  await db
    .delete(campaignsTable)
    .where(eq(campaignsTable.id, params.data.id));

  res.sendStatus(204);
});

router.post("/campaigns/:id/send", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = SendCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(
      and(
        eq(campaignsTable.id, params.data.id),
        eq(campaignsTable.userId, req.user.id),
      ),
    );

  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  const contacts = await db
    .select()
    .from(contactsTable)
    .where(
      and(
        eq(contactsTable.categoryId, campaign.categoryId),
        eq(contactsTable.userId, req.user.id),
      ),
    );

  if (contacts.length === 0) {
    res.status(400).json({ error: "No contacts in this category" });
    return;
  }

  await db
    .update(campaignsTable)
    .set({ status: "sending" })
    .where(eq(campaignsTable.id, campaign.id));

  const result = await sendCampaignEmails(campaign, contacts);

  await db
    .update(campaignsTable)
    .set({
      status: result.failed === contacts.length ? "failed" : "sent",
      sentAt: new Date(),
    })
    .where(eq(campaignsTable.id, campaign.id));

  res.json(result);
});

export default router;
