import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import {
  db,
  emailsTable,
  campaignsTable,
  contactsTable,
} from "@workspace/db";
import { ListEmailsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/emails", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const query = ListEmailsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { campaignId, status, page, limit } = query.data;
  const offset = (page - 1) * limit;

  const conditions = [eq(campaignsTable.userId, req.user.id)];
  if (campaignId) {
    conditions.push(eq(emailsTable.campaignId, campaignId));
  }
  if (status) {
    conditions.push(eq(emailsTable.status, status as "sent" | "failed"));
  }

  const [{ total }] = await db
    .select({ total: sql<number>`cast(count(*) as int)` })
    .from(emailsTable)
    .leftJoin(campaignsTable, eq(campaignsTable.id, emailsTable.campaignId))
    .where(and(...conditions));

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
    .where(and(...conditions))
    .orderBy(sql`${emailsTable.sentAt} desc`)
    .limit(limit)
    .offset(offset);

  res.json({ emails, total, page, limit });
});

export default router;
