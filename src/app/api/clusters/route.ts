import { NextResponse } from "next/server";
import { getSessionOrDefault } from "@/lib/auth/session";
import { clearReadCache } from "@/lib/db/sql";
import { withTransaction } from "@/lib/db/write";
import { getClusterEditorData } from "@/lib/clusters";

export async function GET() {
  const session = await getSessionOrDefault();
  if (!session.isLoggedIn || !session.user?.active) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try { return NextResponse.json(await getClusterEditorData()); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load clusters." }, { status: 500 }); }
}

export async function POST(request: Request) {
  const session = await getSessionOrDefault();
  if (!session.isLoggedIn || !session.user?.active) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const body = await request.json() as { action?: string; id?: number; sourceId?: number; clusterId?: number; stateCityId?: number; name?: string; sort?: number | null; licensedEmployeeSearch?: boolean; countyFilter?: string; active?: boolean; clusterCityId?: number };
    const action = body.action;
    const saved = await withTransaction(async run => {
      if (action === "add-cluster") {
        const name = String(body.name ?? "").trim();
        if (!name || name.length > 150) throw new Error("Enter a cluster name (up to 150 characters).");
        const result = await run(`INSERT INTO dbo.tblClusters(Cluster,ClusterSort,ClusterLicensedEmployeeSearch,ClusterActive,ClusterCountyFilter)
          OUTPUT INSERTED.ClusterID id VALUES(@name,(SELECT ISNULL(MAX(ClusterSort),0)+1 FROM dbo.tblClusters),1,1,NULL)`, [{ name: "name", value: name }]);
        return Number((result.recordset[0] as { id: number }).id);
      }
      if (action === "update-cluster") {
        const id = Number(body.id); const name = String(body.name ?? "").trim(); const countyFilter = String(body.countyFilter ?? "").trim();
        if (!Number.isSafeInteger(id) || id <= 0 || !name || name.length > 150 || countyFilter.length > 255) throw new Error("Enter a valid cluster name and county filter.");
        const result = await run(`UPDATE dbo.tblClusters SET Cluster=@name,ClusterSort=@sort,ClusterLicensedEmployeeSearch=@licensed,ClusterCountyFilter=@county,ClusterActive=@active WHERE ClusterID=@id`, [
          { name: "name", value: name }, { name: "sort", value: Number.isFinite(Number(body.sort)) ? Number(body.sort) : null },
          { name: "licensed", value: Boolean(body.licensedEmployeeSearch) }, { name: "county", value: countyFilter || null },
          { name: "active", value: body.active === false ? 0 : 1 }, { name: "id", value: id },
        ]);
        if (!result.rowsAffected[0]) throw new Error("Cluster not found.");
        return id;
      }
      if (action === "copy-cluster") {
        const sourceId = Number(body.sourceId); const name = String(body.name ?? "").trim();
        if (!Number.isSafeInteger(sourceId) || sourceId <= 0 || !name || name.length > 150) throw new Error("Choose a source cluster and enter a name for the copy.");
        const result = await run(`INSERT INTO dbo.tblClusters(Cluster,ClusterSort,ClusterLicensedEmployeeSearch,ClusterActive,ClusterCountyFilter)
          OUTPUT INSERTED.ClusterID id SELECT @name,(SELECT ISNULL(MAX(ClusterSort),0)+1 FROM dbo.tblClusters),ClusterLicensedEmployeeSearch,1,ClusterCountyFilter FROM dbo.tblClusters WHERE ClusterID=@source`, [{ name: "name", value: name }, { name: "source", value: sourceId }]);
        const id = Number((result.recordset[0] as { id: number } | undefined)?.id);
        if (!id) throw new Error("Source cluster not found.");
        await run(`INSERT INTO dbo.tblClusterCities(ClusterID,StateCityID,ClusterCityActive)
          SELECT @target,StateCityID,ClusterCityActive FROM dbo.tblClusterCities WHERE ClusterID=@source`, [{ name: "target", value: id }, { name: "source", value: sourceId }]);
        return id;
      }
      if (action === "add-city") {
        const clusterId = Number(body.clusterId); const stateCityId = Number(body.stateCityId);
        if (!Number.isSafeInteger(clusterId) || clusterId <= 0 || !Number.isSafeInteger(stateCityId) || stateCityId <= 0) throw new Error("Choose a cluster and a city.");
        const existing = await run(`SELECT ClusterCityID FROM dbo.tblClusterCities WITH (UPDLOCK,HOLDLOCK) WHERE ClusterID=@cluster AND StateCityID=@city`, [{ name: "cluster", value: clusterId }, { name: "city", value: stateCityId }]);
        if (existing.recordset.length) await run(`UPDATE dbo.tblClusterCities SET ClusterCityActive=1 WHERE ClusterID=@cluster AND StateCityID=@city`, [{ name: "cluster", value: clusterId }, { name: "city", value: stateCityId }]);
        else await run(`INSERT INTO dbo.tblClusterCities(ClusterID,StateCityID,ClusterCityActive) VALUES(@cluster,@city,1)`, [{ name: "cluster", value: clusterId }, { name: "city", value: stateCityId }]);
        return clusterId;
      }
      if (action === "update-city") {
        const id = Number(body.clusterCityId);
        if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Select a cluster city.");
        const result = await run(`UPDATE dbo.tblClusterCities SET ClusterCityActive=@active WHERE ClusterCityID=@id`, [{ name: "active", value: body.active === false ? 0 : 1 }, { name: "id", value: id }]);
        if (!result.rowsAffected[0]) throw new Error("Cluster city not found.");
        return Number(body.clusterId);
      }
      throw new Error("Unsupported cluster action.");
    });
    clearReadCache();
    return NextResponse.json({ ...(await getClusterEditorData()), savedClusterId: saved });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save cluster." }, { status: 400 }); }
}
