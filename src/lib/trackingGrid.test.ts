import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { TrackingPreviewRow } from "@/types/tracking";
import { compareTrackingRows, dailyTotal, filterTrackingRows, groupTrackingRows, trackingJobKey, trackingCsv } from "./trackingGrid";
import { trackingDayColor, trackingGradeColor, PAYROLL_COLOR_IDS } from "./trackingConstants";
const row = (values: Partial<TrackingPreviewRow>) => ({ employeeId:"1",firstName:"Ana",lastName:"Smith",cell:"(555) 123-4567",satHours:"",sunHours:"",monHours:"8",tueHours:"7.5",wedHours:"0",thuHours:"",friHours:"",...values } as TrackingPreviewRow);

test("Access tracking colors respect grade and status overrides", () => {
  assert.equal(trackingGradeColor("A1"), "#ff0000");
  assert.equal(trackingGradeColor("B5"), "#0000ff");
  assert.equal(trackingGradeColor("C"), undefined);
  assert.equal(trackingDayColor("", 0), "#4bacc6");
  assert.equal(trackingDayColor("", 1), "#fff200");
  assert.equal(trackingDayColor("5", 1), "#ed1c24");
  assert.equal(trackingDayColor("7", 0), "#f9cdaa");
  assert.equal(trackingDayColor("8", 2), "#ffc20e");
  assert.equal(PAYROLL_COLOR_IDS[11], "#ffa500");
});

test("job grouping keeps assignments together and preserves source indexes and employee order", () => {
  const entries = filterTrackingRows([
    row({customerId:"1",projectId:"10",jobSite:"Shop"}),
    row({customerId:"2",projectId:"20",jobSite:"Shop"}),
    row({customerId:"1",projectId:"10",jobSite:"Shop",employeeId:"2"}),
    row({customerId:"1",projectId:"11",jobSite:"Shop"}),
  ], "");
  const grouped = groupTrackingRows(entries);
  assert.deepEqual(grouped.map(entry => entry.index), [0,2,1,3]);
  assert.equal(trackingJobKey(grouped[0].row), trackingJobKey(grouped[1].row));
  assert.notEqual(trackingJobKey(grouped[0].row), trackingJobKey(grouped[2].row));
  assert.notEqual(trackingJobKey(grouped[0].row), trackingJobKey(grouped[3].row));
  assert.deepEqual(entries.map(entry => entry.index), [0,1,2,3]);
});
test("search matches separate terms and normalized phone numbers",()=>{const rows=[row({}),row({employeeId:"2",firstName:"Bob",cell:"999"})];assert.equal(filterTrackingRows(rows,"smith ana").length,1);assert.equal(filterTrackingRows(rows,"5551234567").length,1);assert.equal(filterTrackingRows(rows,"ana", "2").length,0);assert.equal(filterTrackingRows(rows,"not found").length,0);});
test("duplicate employee assignments retain distinct source indexes",()=>{assert.deepEqual(filterTrackingRows([row({}),row({jobSite:"Second job"})],"").map(v=>v.index),[0,1]);});
test("rates sort numerically and missing rates stay last in either direction",()=>{assert.ok(compareTrackingRows(row({payRate:"$9.00"}),row({payRate:"$100.00"}),"payRate","asc")<0);assert.ok(compareTrackingRows(row({payRate:""}),row({payRate:"$100.00"}),"payRate","desc")>0);});
test("daily hours total ignores blanks and nonnumeric values",()=>{assert.equal(dailyTotal(row({friHours:"OFF"})),15.5);});
test("CSV escapes quotes, multiline values and spreadsheet formulas",()=>{assert.equal(trackingCsv(["Name","Note"],[["O\"Neil","line 1\nline 2"],["=1+1","normal"]]),'"Name","Note"\r\n"O""Neil","line 1\nline 2"\r\n"\'=1+1","normal"');});
