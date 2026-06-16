import { db, emailsTable, contactsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

type Contact = typeof contactsTable.$inferSelect;
type Campaign = { id: number; subject: string; body: string };

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    logger.warn("RESEND_API_KEY not set — email sending is disabled");
    return { ok: false, error: "Email sending is not configured" };
  }

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? "outreach@devdonna.se",
        to,
        subject,
        html,
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      return { ok: false, error: `Resend error ${resp.status}: ${body}` };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

function personalizeBody(body: string, contact: Contact): string {
  return body
    .replace(/\{\{company\}\}/gi, contact.companyName)
    .replace(/\{\{name\}\}/gi, contact.contactName ?? contact.companyName)
    .replace(/\{\{email\}\}/gi, contact.email)
    .replace(/\{\{website\}\}/gi, contact.website ?? "");
}

export async function sendCampaignEmails(
  campaign: Campaign,
  contacts: Contact[],
): Promise<{ sent: number; failed: number; total: number }> {
  let sent = 0;
  let failed = 0;

  for (const contact of contacts) {
    const html = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
${personalizeBody(campaign.body, contact).replace(/\n/g, "<br>")}
</div>`;

    const result = await sendViaResend(contact.email, campaign.subject, html);

    await db.insert(emailsTable).values({
      campaignId: campaign.id,
      contactId: contact.id,
      status: result.ok ? "sent" : "failed",
      errorMessage: result.error ?? null,
    });

    if (result.ok) {
      await db
        .update(contactsTable)
        .set({ status: "sent" })
        .where(eq(contactsTable.id, contact.id));
      sent++;
    } else {
      await db
        .update(contactsTable)
        .set({ status: "failed" })
        .where(eq(contactsTable.id, contact.id));
      failed++;
    }
  }

  return { sent, failed, total: contacts.length };
}
