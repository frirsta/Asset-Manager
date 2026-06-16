import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import {
  db,
  contactsTable,
  categoriesTable,
  campaignsTable,
  emailsTable,
} from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;

  const [[contactStats], [emailStats], categories, recentCampaigns] =
    await Promise.all([
      db
        .select({
          totalContacts: sql<number>`cast(count(*) as int)`,
          pendingContacts: sql<number>`cast(sum(case when ${contactsTable.status} = 'pending' then 1 else 0 end) as int)`,
        })
        .from(contactsTable)
        .where(eq(contactsTable.userId, userId)),

      db
        .select({
          totalEmailsSent: sql<number>`cast(sum(case when ${emailsTable.status} = 'sent' then 1 else 0 end) as int)`,
          totalEmailsFailed: sql<number>`cast(sum(case when ${emailsTable.status} = 'failed' then 1 else 0 end) as int)`,
        })
        .from(emailsTable)
        .leftJoin(campaignsTable, eq(campaignsTable.id, emailsTable.campaignId))
        .where(eq(campaignsTable.userId, userId)),

      db
        .select({
          categoryId: categoriesTable.id,
          categoryName: categoriesTable.name,
          count: sql<number>`cast(count(${contactsTable.id}) as int)`,
        })
        .from(categoriesTable)
        .leftJoin(
          contactsTable,
          eq(contactsTable.categoryId, categoriesTable.id),
        )
        .where(eq(categoriesTable.userId, userId))
        .groupBy(categoriesTable.id)
        .orderBy(sql`count(${contactsTable.id}) desc`),

      db
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
        .where(eq(campaignsTable.userId, userId))
        .groupBy(campaignsTable.id, categoriesTable.name)
        .orderBy(sql`${campaignsTable.createdAt} desc`)
        .limit(5),
    ]);

  const [{ totalCampaigns }] = await db
    .select({ totalCampaigns: sql<number>`cast(count(*) as int)` })
    .from(campaignsTable)
    .where(eq(campaignsTable.userId, userId));

  res.json({
    totalContacts: contactStats?.totalContacts ?? 0,
    pendingContacts: contactStats?.pendingContacts ?? 0,
    totalCategories: categories.length,
    totalEmailsSent: emailStats?.totalEmailsSent ?? 0,
    totalEmailsFailed: emailStats?.totalEmailsFailed ?? 0,
    totalCampaigns,
    recentCampaigns,
    contactsByCategory: categories,
  });
});

export default router;
