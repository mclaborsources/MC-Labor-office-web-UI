import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/origin";
import { clearReadCache } from "@/lib/db/sql";
import { withTransaction, WritesDisabledError } from "@/lib/db/write";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const transferSchema = z.object({
  profile: z.string().trim().min(1).max(80),
  customerIds: z.array(z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER)).min(1),
});

function normalizeProfileName(value: string) {
  const normalized = value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
  return normalized === "cust search" ? "customer search" : normalized;
}

async function requireAdmin() {
  const session = await requireSession();
  if (!session.user?.roles.includes("admin")) throw new Error("Administrator sign-in required to transfer customer profiles.");
  return session;
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "The customer profile transfer failed.";
  const status = message === "Unauthorized" ? 401
    : message.includes("Administrator sign-in") ? 403
      : error instanceof z.ZodError || error instanceof SyntaxError || message.includes("Select") || message.includes("Choose") ? 400
        : error instanceof WritesDisabledError ? 403 : 500;
  if (status === 500) console.error("[customer-admin-utilities] transfer failed", error);
  return NextResponse.json({ ok: false, error: status === 500 ? "The database could not transfer the selected customers." : message }, { status });
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  try {
    await requireAdmin();
    const body = transferSchema.parse(await request.json());
    const customerIds = [...new Set(body.customerIds)];
    const targetName = normalizeProfileName(body.profile);
    const transferResult = await withTransaction(async run => {
      const profiles = await run(`SELECT PullDownCustomerProfileTypeID AS id, PullDownCustomerProfileType AS name
        FROM dbo.tblPullDownCustomerProfileTypes WITH (UPDLOCK, HOLDLOCK)`);
      const profile = (profiles.recordset as { id: number; name: string }[])
        .find(row => normalizeProfileName(row.name) === targetName);
      if (!profile) throw new Error(`Choose a profile type that exists in the database: ${body.profile}.`);

      let affected = 0;
      for (let offset = 0; offset < customerIds.length; offset += 500) {
        const batch = customerIds.slice(offset, offset + 500);
        const params = batch.map((id, index) => ({ name: `customerId${index}`, value: id }));
        const ids = batch.map((_, index) => `@customerId${index}`).join(",");
        const result = await run(`UPDATE dbo.tblCustomer SET CustomerProfileTypeID=@profileId WHERE CustomerID IN (${ids})`, [
          { name: "profileId", value: profile.id }, ...params,
        ]);
        affected += result.rowsAffected.reduce((sum, count) => sum + count, 0);
      }
      if (!affected) throw new Error("No selected customer records were found; nothing was changed.");
      return { affected, profileName: profile.name };
    });
    clearReadCache();
    return NextResponse.json({ ok: true, transferred: transferResult.affected, profileName: transferResult.profileName });
  } catch (error) {
    return errorResponse(error);
  }
}
