import { queryReadOnly } from "@/lib/db/sql";

export interface StateCityRecord { id: number; stateId: number; state: string; city: string; active: boolean }
export interface StateOption { id: number; name: string }

export async function getStateCityRecords(): Promise<{ cities: StateCityRecord[]; states: StateOption[] }> {
  const [cities, states] = await Promise.all([
    queryReadOnly<StateCityRecord>(`SELECT sc.PullDownStateCityID id,sc.StateID stateId,
      ISNULL(st.PullDownState,'') state,ISNULL(sc.City,'') city,
      CAST(ISNULL(sc.PullDownStateCityActive,1) AS bit) active
      FROM dbo.tblPullDownStateCities sc WITH (NOLOCK)
      LEFT JOIN dbo.tblPullDownStates st WITH (NOLOCK) ON st.PullDownStateID=sc.StateID
      ORDER BY st.PullDownState,sc.City,sc.PullDownStateCityID`),
    queryReadOnly<StateOption>(`SELECT PullDownStateID id,ISNULL(PullDownState,'') name
      FROM dbo.tblPullDownStates WITH (NOLOCK) ORDER BY PullDownState`),
  ]);
  return { cities, states };
}
