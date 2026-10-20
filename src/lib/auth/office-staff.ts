import { createHash, timingSafeEqual, randomUUID } from "node:crypto";
import { hostname } from "node:os";
import { queryReadOnlyUncached } from "@/lib/db/sql";
import { queryWrite, withTransaction } from "@/lib/db/write";
import type { SessionUser } from "@/types/auth";

export interface OfficeStaffOption { id: number; name: string }
export interface OfficeFeature { objectName: string; controlName: string; title: string }
export async function listOfficeStaff(): Promise<OfficeStaffOption[]> {
  return queryReadOnlyUncached<OfficeStaffOption>(`SELECT OfficeStaffID AS id,
    ISNULL(OfficeStaffFullName,'') AS name FROM tblOfficeStaff
    WHERE OfficeStaffActive=1 AND ISNULL(Profile,0)=0 AND OfficeStaffID<>0
    ORDER BY OfficeStaffFullName,OfficeStaffID`);
}

const attempts = new Map<number, { count: number; until: number }>();
export function matchesAccessPassword(input: string, saved: string): boolean {
  // frmLogin uses StrComp under Option Compare Database (case insensitive).
  const digest = (value: string) => createHash("sha256").update(value.toLocaleLowerCase("en-US")).digest();
  return timingSafeEqual(digest(input), digest(saved));
}

export async function authenticateOfficeStaff(id: number, password: string): Promise<SessionUser | null> {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
  const previous = attempts.get(id);
  if (previous && previous.count >= 10) throw new Error("Too many attempts. Try again in 15 minutes.");
  attempts.set(id, { count: (previous?.count ?? 0) + 1, until: previous?.until ?? now + 900_000 });
  const [staff] = await queryReadOnlyUncached<{
    id: number; name: string; password: string | null; initials: string | null;
    title: string | null; email: string | null; canDelete: boolean;
  }>(`SELECT OfficeStaffID AS id,OfficeStaffFullName AS name,OfficeStaffPassword AS password,
    Initials AS initials,OfficeStaffTitle AS title,OfficeStaffEmail AS email,OfficeStaffCanDelete AS canDelete
    FROM tblOfficeStaff WHERE OfficeStaffID=@id AND OfficeStaffID<>0
      AND OfficeStaffActive=1 AND ISNULL(Profile,0)=0`, [{ name: "id", value: id }]);
  if (!staff?.password || !matchesAccessPassword(password, staff.password)) return null;
  attempts.delete(id);
  const features = await getOfficeFeatures(id);
  return { officeStaffId: staff.id, userId: `office-${staff.id}`, username: String(staff.id),
    displayName: staff.name, initials: staff.initials ?? "", title: staff.title ?? "", email: staff.email ?? "",
    canDelete: !!staff.canDelete, active: true,
    roles: features.some(feature => feature.objectName === "frmOfficeStaffPermission") ? ["admin", "user"] : ["user"] };
}

export async function officeStaffActive(id: number): Promise<boolean> {
  const rows = await queryReadOnlyUncached(`SELECT OfficeStaffID FROM tblOfficeStaff
    WHERE OfficeStaffID=@id AND OfficeStaffID<>0 AND OfficeStaffActive=1 AND ISNULL(Profile,0)=0`, [{ name: "id", value: id }]);
  return rows.length === 1;
}

export function getOfficeFeatures(id: number): Promise<OfficeFeature[]> {
  return queryReadOnlyUncached<OfficeFeature>(`SELECT f.ObjectName AS objectName,
    ISNULL(f.ControlName,'') AS controlName,ISNULL(f.FeatureTitle,'') AS title
    FROM tblOfficeStaffPermission p INNER JOIN tblFeature f ON f.FeatureID=p.FeatureID
    WHERE p.OfficeStaffID=@id AND f.FeatureActive=1`, [{ name: "id", value: id }]);
}

export async function startOfficeLogin(user: SessionUser): Promise<number> {
  return withTransaction(async run => {
    const result = await run(`INSERT INTO tblOfficeStaffLogin
      (OfficeStaffID,OfficeStaffFullName,NetworkName,ComputerName,OfficeStaffLoginTimestamp)
      OUTPUT INSERTED.OfficeStaffLoginID AS id
      VALUES (@id,@name,@network,@computer,GETDATE())`, [
      { name: "id", value: user.officeStaffId! }, { name: "name", value: user.displayName },
      { name: "network", value: `WEB:${randomUUID()}` }, { name: "computer", value: hostname().slice(0, 100) },
    ]);
    return (result.recordset[0] as { id: number }).id;
  });
}

export async function endOfficeLogin(loginId: number, staffId: number, logoutType: "User" | "Timeout" = "User"): Promise<void> {
  await queryWrite(`UPDATE tblOfficeStaffLogin SET OfficeStaffLogoutTimestamp=GETDATE(),OfficeStaffLogoutType=@type
    WHERE OfficeStaffLoginID=@loginId AND OfficeStaffID=@staffId AND OfficeStaffLogoutTimestamp IS NULL`,
  [{ name: "loginId", value: loginId }, { name: "staffId", value: staffId }, { name: "type", value: logoutType }]);
}
