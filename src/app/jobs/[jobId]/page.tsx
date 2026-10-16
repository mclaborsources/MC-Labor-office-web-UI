import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { JobProfileScreen } from "@/components/jobs/JobProfileScreen";
import { getSessionOrDefault } from "@/lib/auth/session";
import { getJobSiteData } from "@/lib/jobSiteData";
import { getJobById } from "@/lib/jobs";
export default async function JobDetailPage({params}:{params:Promise<{jobId:string}>}){
 const {jobId}=await params;const session=await getSessionOrDefault();const [job,site]=await Promise.all([getJobById(jobId),getJobSiteData(jobId)]);if(!job)notFound();
 return <AppShell userDisplayName={session.user?.displayName} fillViewport fullWidth><JobProfileScreen key={jobId} job={job} site={site}/></AppShell>;
}
