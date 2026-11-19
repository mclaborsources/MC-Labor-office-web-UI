"use client";
import {AccessButton} from "@/components/access/AccessButton";
export function ReportRenameViewButton(){return <span className="report-rename-view-slot"><AccessButton data-action-status="complete" onClick={()=>window.dispatchEvent(new Event("accounting-view-rename"))}>Rename View</AccessButton></span>;}