import sql from "mssql";
import { createHash } from "node:crypto";
import type { QueryParam } from "@/types/db";
import { employeeSearchPresetSeeds, employeeViewLayoutSchema } from "@/lib/employeeSavedViews";

export async function ensureEmployeeSavedViewsTable(pool: sql.ConnectionPool) {
  await pool.request().query(`
    IF OBJECT_ID(N'dbo.WebEmployeeSavedView', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.WebEmployeeSavedView (
        UserKey nvarchar(128) NOT NULL,
        Slot int NOT NULL CHECK (Slot BETWEEN 1 AND 64),
        ViewName nvarchar(80) NOT NULL,
        LayoutJson nvarchar(max) NOT NULL CHECK (ISJSON(LayoutJson)=1),
        UpdatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_WebEmployeeSavedView PRIMARY KEY (UserKey, Slot)
      );
    END;
  `);
}

export async function ensureEmployeeSearchPresetsTable(pool: sql.ConnectionPool) {
  await pool.request().query(`
    IF OBJECT_ID(N'dbo.WebEmployeeSearchPreset', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.WebEmployeeSearchPreset (
        PresetSlot int NOT NULL PRIMARY KEY CHECK (PresetSlot BETWEEN 1 AND 60),
        PresetName nvarchar(80) NOT NULL,
        LayoutJson nvarchar(max) NOT NULL CHECK (ISJSON(LayoutJson)=1),
        DefinitionHash char(64) NULL,
        UpdatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
      );
    END;
    IF COL_LENGTH(N'dbo.WebEmployeeSearchPreset', N'DefinitionHash') IS NULL
      ALTER TABLE dbo.WebEmployeeSearchPreset ADD DefinitionHash char(64) NULL;
  `);

  const seeds = employeeSearchPresetSeeds().map(preset => {
    const layout = employeeViewLayoutSchema.parse(preset.layout);
    const layoutJson = JSON.stringify(layout);
    return { ...preset, layoutJson, definitionHash: createHash("sha256").update(`${preset.name}\n${layoutJson}`).digest("hex") };
  });
  const tuples = seeds.map((preset, index) => `(@slot${index}, @name${index}, @layout${index}, @hash${index})`);
  const params: QueryParam[] = seeds.flatMap((preset, index) => [
    { name: `slot${index}`, value: preset.slot },
    { name: `name${index}`, value: preset.name },
    { name: `layout${index}`, value: preset.layoutJson },
    { name: `hash${index}`, value: preset.definitionHash },
  ]);
  const source = `(VALUES ${tuples.join(",")}) AS source(PresetSlot, PresetName, LayoutJson, DefinitionHash)`;
  await transaction(pool, async run => {
    await run(`
      UPDATE target WITH (UPDLOCK, SERIALIZABLE)
      SET PresetName=source.PresetName,
          LayoutJson=source.LayoutJson,
          DefinitionHash=source.DefinitionHash,
          UpdatedAt=SYSUTCDATETIME()
      FROM dbo.WebEmployeeSearchPreset target
      JOIN ${source} ON source.PresetSlot=target.PresetSlot
      WHERE ISNULL(target.DefinitionHash, '') <> source.DefinitionHash;
    `, params);
    await run(`
      INSERT INTO dbo.WebEmployeeSearchPreset (PresetSlot, PresetName, LayoutJson, DefinitionHash)
      SELECT source.PresetSlot, source.PresetName, source.LayoutJson, source.DefinitionHash
      FROM ${source}
      WHERE NOT EXISTS (
        SELECT 1 FROM dbo.WebEmployeeSearchPreset existing WITH (UPDLOCK, HOLDLOCK)
        WHERE existing.PresetSlot=source.PresetSlot
      );
    `, params);
  });
}

async function transaction<T>(pool: sql.ConnectionPool, work: (run: (query: string, params?: QueryParam[]) => Promise<sql.IResult<unknown>>) => Promise<T>) {
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const run = async (query: string, params?: QueryParam[]) => {
      const request = new sql.Request(tx);
      for (const param of params ?? []) request.input(param.name, param.value);
      return request.query(query);
    };
    const result = await work(run);
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback().catch(() => undefined);
    throw error;
  }
}

export async function saveEmployeeSavedView(pool: sql.ConnectionPool, userKey: string, slot: number, name: string, layout: string) {
  await transaction(pool, async run => {
    await run(`UPDATE dbo.WebEmployeeSavedView WITH (UPDLOCK,SERIALIZABLE)
      SET ViewName=@name,LayoutJson=@layout,UpdatedAt=SYSUTCDATETIME()
      WHERE UserKey=@user AND Slot=@slot;
      IF @@ROWCOUNT=0 INSERT INTO dbo.WebEmployeeSavedView(UserKey,Slot,ViewName,LayoutJson)
      VALUES(@user,@slot,@name,@layout);`, [
      { name: "user", value: userKey }, { name: "slot", value: slot }, { name: "name", value: name }, { name: "layout", value: layout },
    ]);
  });
}

export async function deleteEmployeeSavedView(pool: sql.ConnectionPool, userKey: string, slot: number) {
  await transaction(pool, run => run(
    "DELETE FROM dbo.WebEmployeeSavedView WHERE UserKey=@user AND Slot=@slot",
    [{ name: "user", value: userKey }, { name: "slot", value: slot }],
  ));
}
