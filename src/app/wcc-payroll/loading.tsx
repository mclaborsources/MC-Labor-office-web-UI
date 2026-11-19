import {AppShell} from "@/components/layout/AppShell";
import {WccPayrollScreen} from "@/components/wcc-payroll/WccPayrollScreen";
export default function Loading(){return <AppShell fullWidth fillViewport compactHeader><WccPayrollScreen options={{states:[],companies:[],years:[]}} criteria={{}}/></AppShell>;}