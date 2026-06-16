import { Router, type IRouter } from "express";
import multer from "multer";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { db, contactsTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

interface RawRow {
  company_name?: string;
  companyname?: string;
  company?: string;
  contact_name?: string;
  contactname?: string;
  name?: string;
  email?: string;
  website?: string;
  industry?: string;
  city?: string;
  country?: string;
  phone?: string;
  notes?: string;
  [key: string]: string | undefined;
}

function normalizeRow(raw: RawRow): Partial<typeof contactsTable.$inferInsert> | null {
  const lower: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v != null) lower[k.toLowerCase().replace(/\s+/g, "_")] = String(v).trim();
  }

  const companyName =
    lower["company_name"] || lower["companyname"] || lower["company"] || lower["company name"];
  const email = lower["email"] || lower["email_address"] || lower["email address"];

  if (!companyName || !email) return null;

  return {
    companyName,
    email,
    contactName: lower["contact_name"] || lower["contactname"] || lower["name"] || lower["contact name"] || null,
    website: lower["website"] || lower["url"] || null,
    industry: lower["industry"] || null,
    city: lower["city"] || null,
    country: lower["country"] || null,
    phone: lower["phone"] || lower["phone_number"] || lower["phone number"] || null,
    notes: lower["notes"] || lower["note"] || null,
  };
}

router.post("/contacts/import", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const { originalname, buffer, mimetype } = req.file;
  const ext = originalname.split(".").pop()?.toLowerCase();

  let rows: RawRow[] = [];

  try {
    if (ext === "csv" || mimetype === "text/csv") {
      const text = buffer.toString("utf-8");
      const parsed = Papa.parse<RawRow>(text, { header: true, skipEmptyLines: true });
      rows = parsed.data;
    } else if (ext === "xlsx" || ext === "xls") {
      const wb = XLSX.read(buffer, { type: "buffer" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json<RawRow>(sheet);
    } else {
      res.status(400).json({ error: "Unsupported file type. Upload a .csv or .xlsx file." });
      return;
    }
  } catch (err) {
    logger.error({ err }, "File parse error");
    res.status(400).json({ error: "Could not parse file" });
    return;
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const normalized = normalizeRow(rows[i]);
    if (!normalized) {
      skipped++;
      continue;
    }

    try {
      await db
        .insert(contactsTable)
        .values({ ...normalized, userId: req.user.id } as typeof contactsTable.$inferInsert)
        .onConflictDoNothing();
      imported++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Row ${i + 2}: ${msg}`);
      skipped++;
    }
  }

  res.json({ imported, skipped, errors });
});

export default router;
