/** Default Start Week Ending; explicit report criteria always win. */
export function defaultReportStartDate(now:Date=new Date()){return `${now.getFullYear()}-01-02`;}
export function applyReportStartDefault(criteria:Record<string,string|undefined>){if(!criteria.startDate)criteria.startDate=defaultReportStartDate();return criteria;}
