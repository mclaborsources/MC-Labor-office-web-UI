import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffAdmin, StaffAdminError } from "@/lib/auth/staff-admin";
import { getOfficeStaffList } from "@/lib/admin";
import { clearReadCache, queryReadOnlyUncached } from "@/lib/db/sql";
import { withTransaction, WritesDisabledError } from "@/lib/db/write";
import { staffInputSchema, staffColumnMap, staffEmailColumns, staffPasswordSchema, staffMutationSchema } from "@/lib/officeStaffEditing";

export async function GET(request: Request) {
  try {
    await requireStaffAdmin(request);
    clearReadCache();
    const [staff, features, grants] = await Promise.all([
      getOfficeStaffList(true),
      queryReadOnlyUncached(`SELECT FeatureID AS id, ISNULL(FeatureTitle,ObjectName) AS title, ObjectName AS objectName, ISNULL(ControlName,'') AS controlName, ISNULL(FeatureDescription,'') AS description, ISNULL(FeatureNotes01,'') AS myNote, ISNULL(FeatureNotes02,'') AS level, ISNULL(FeatureNotes09,'') AS matt, ISNULL(FeatureNotes03,'') AS ryan, ISNULL(FeatureNotes04,'') AS sharon, ISNULL(FeatureNotes05,'') AS joeN, ISNULL(FeatureNotes06,'') AS note06, ISNULL(FeatureNotes07,'') AS note07, ISNULL(FeatureNotes08,'') AS note08, ISNULL(FeatureNotes10,'') AS note10, ISNULL(FeatureNotes11,'') AS note11, ISNULL(FeatureNotes12,'') AS note12 FROM tblFeature WHERE FeatureActive=1 ORDER BY FeatureID`),
      queryReadOnlyUncached(`SELECT OfficeStaffID AS staffId, FeatureID AS featureId FROM tblOfficeStaffPermission`),
    ]);
    return NextResponse.json({ staff, features, grants }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}

function failure(error: unknown) {
  if (error instanceof StaffAdminError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("; ") }, { status: 400 });
  if (error instanceof Error && error.message === "You do not have permission to delete data.") return NextResponse.json({ error: error.message }, { status: 403 });
  if (error instanceof WritesDisabledError) return NextResponse.json({ error: "Database writes are disabled on this installation." }, { status: 403 });
  return NextResponse.json({ error: "The change could not be completed. The record may be referenced elsewhere or have changed. Refresh and try again." }, { status: 409 });
}

export async function POST(request: Request) {
  try {
    const session = await requireStaffAdmin(request);
    const body = staffMutationSchema.parse(await request.json());
    const ownId = session.user?.officeStaffId;
    const result = await withTransaction(async run => {
      if (body.action === "save") {
        const data = staffInputSchema.parse(body.record);
        if (Number(data.staffId) === ownId && (!data.active || data.profile)) throw new StaffAdminError("You cannot deactivate your own account or turn it into a profile.");
        const entries: { column: string; value: string | boolean }[] = Object.entries(staffColumnMap).map(([key, column]) => ({ column, value: data[key as keyof typeof staffColumnMap] }));
        entries.push({ column: "OfficeStaffFullName", value: `${data.firstName} ${data.lastName}` });
        staffEmailColumns.forEach((column, i) => entries.push({ column, value: data.emailOptions[i] }));
        const params = entries.map((entry, i) => ({ name: `v${i}`, value: entry.value }));
        if (data.staffId) {
          const updated = await run(`UPDATE tblOfficeStaff SET ${entries.map((entry, i) => `[${entry.column}]=@v${i}`).join(",")} WHERE OfficeStaffID=@id`, [...params, { name: "id", value: Number(data.staffId) }]);
          if (updated.rowsAffected[0] !== 1) throw new StaffAdminError("Staff record no longer exists.", 404);
          return { id: data.staffId };
        }
        if (body.initialPassword !== undefined) {
          entries.push({ column: "OfficeStaffPassword", value: body.initialPassword });
          params.push({ name: `v${entries.length - 1}`, value: body.initialPassword });
        }
        const columns = entries.map(entry => `[${entry.column}]`).join(",");
        const values = entries.map((_, i) => `@v${i}`).join(",");
        const inserted = await run(`INSERT INTO tblOfficeStaff (${columns}) OUTPUT INSERTED.OfficeStaffID AS id VALUES (${values})`, params);
        return { id: String((inserted.recordset[0] as { id: number }).id) };
      }
      const id = z.coerce.number().int().positive().parse(body.id);
      if (body.action === "password") {
        const { password } = staffPasswordSchema.parse(body);
        const updated = await run(`UPDATE tblOfficeStaff SET OfficeStaffPassword=@password WHERE OfficeStaffID=@id`, [{ name: "id", value: id }, { name: "password", value: password }]);
        if (updated.rowsAffected[0] !== 1) throw new StaffAdminError("Staff record no longer exists.", 404);
      } else if (body.action === "delete") {
        if (id === ownId) throw new StaffAdminError("You cannot delete your own account.");
        await run(`DELETE FROM tblOfficeStaffPermission WHERE OfficeStaffID=@id`, [{ name: "id", value: id }]);
        const deleted = await run(`DELETE FROM tblOfficeStaff WHERE OfficeStaffID=@id`, [{ name: "id", value: id }]);
        if (deleted.rowsAffected[0] !== 1) throw new StaffAdminError("Staff record no longer exists.", 404);
      } else if (body.action === "permissions") {
        // Apply only changed grants, preserving unrelated concurrent edits.
        const changes = z.array(z.object({ featureId: z.number().int().positive(), enabled: z.boolean(), staffId: z.number().int().positive().optional() })).max(5000).parse(body.changes);
        for (const note of body.notes ?? []) {
          const updated = await run(`UPDATE tblFeature SET FeatureNotes01=@note WHERE FeatureID=@feature AND ISNULL(FeatureNotes01,'')=@original`, [{ name: "note", value: note.value }, { name: "feature", value: note.featureId }, { name: "original", value: note.original }]);
          if (updated.rowsAffected[0] !== 1) throw new StaffAdminError("A feature note changed elsewhere. Reload before saving.", 409);
        }
        for (const change of changes) {
          const targetId = change.staffId ?? id;
          const target = await run(`SELECT OfficeStaffID FROM tblOfficeStaff WHERE OfficeStaffID=@id`, [{ name: "id", value: targetId }]);
          if (!target.recordset.length) throw new StaffAdminError("Staff record no longer exists.", 404);
          const feature = await run(`SELECT ObjectName FROM tblFeature WHERE FeatureID=@feature AND FeatureActive=1`, [{ name: "feature", value: change.featureId }]);
          if (!feature.recordset.length) throw new StaffAdminError("A selected feature is no longer available.");
          if (!change.enabled && targetId === ownId && (feature.recordset[0] as { ObjectName: string }).ObjectName.toLowerCase() === "frmofficestaffpermission") throw new StaffAdminError("You cannot remove your own staff administration permission.");
          const params = [{ name: "id", value: targetId }, { name: "feature", value: change.featureId }];
          if (change.enabled) await run(`INSERT INTO tblOfficeStaffPermission(OfficeStaffID,FeatureID)
            SELECT @id,@feature WHERE NOT EXISTS(SELECT 1 FROM tblOfficeStaffPermission WITH (UPDLOCK,HOLDLOCK) WHERE OfficeStaffID=@id AND FeatureID=@feature)`, params);
          else await run(`DELETE FROM tblOfficeStaffPermission WHERE OfficeStaffID=@id AND FeatureID=@feature`, params);
        }
      } else throw new StaffAdminError("Unknown action.");
      return { id: String(id) };
    });
    clearReadCache();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) { return failure(error); }
}
