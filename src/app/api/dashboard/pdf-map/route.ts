import fs from "fs";
import { NextResponse } from "next/server";
import { getDashboardSettings } from "@/lib/dashboard";
import { PDF_MAP_RELATIVE_PATH } from "@/lib/dashboardConstants";

export async function GET() {
  const settings = await getDashboardSettings();
  const root = settings.rootFolder.trim();

  if (!root) {
    return NextResponse.json(
      { error: "RootFolder is not set in SettingsBE." },
      { status: 404 },
    );
  }

  const filePath = `${root.replace(/[\\/]+$/, "")}\\${PDF_MAP_RELATIVE_PATH}`;

  try {
    const data = await fs.promises.readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="Work Area.pdf"',
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: "Work Area PDF not found on this server.",
        path: filePath,
        hint: "Access opens RootFolder\\00 Help\\00 Work Area - PDF Map\\Work Area.pdf",
      },
      { status: 404 },
    );
  }
}
