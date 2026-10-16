import { queryReadOnly } from "@/lib/db/sql";

export interface ClusterRow { id: number; name: string; sort: number | null; licensedEmployeeSearch: boolean; countyFilter: string; active: boolean }
export interface ClusterCityRow { id: number; clusterId: number; stateCityId: number; city: string; state: string; active: boolean }
export interface ClusterCityOption { id: number; city: string; state: string }

export async function getClusterEditorData() {
  const [clusters, cities, cityOptions] = await Promise.all([
    queryReadOnly<ClusterRow>(`SELECT ClusterID id,ISNULL(Cluster,'') name,ClusterSort sort,
      CAST(ISNULL(ClusterLicensedEmployeeSearch,0) AS bit) licensedEmployeeSearch,
      ISNULL(ClusterCountyFilter,'') countyFilter,CAST(ISNULL(ClusterActive,1) AS bit) active
      FROM dbo.tblClusters WITH (NOLOCK) ORDER BY ClusterSort,Cluster,ClusterID`),
    queryReadOnly<ClusterCityRow>(`SELECT cc.ClusterCityID id,cc.ClusterID clusterId,cc.StateCityID stateCityId,
      ISNULL(sc.City,'') city,ISNULL(st.PullDownState,'') state,CAST(ISNULL(cc.ClusterCityActive,1) AS bit) active
      FROM dbo.tblClusterCities cc WITH (NOLOCK)
      JOIN dbo.tblPullDownStateCities sc WITH (NOLOCK) ON sc.PullDownStateCityID=cc.StateCityID
      LEFT JOIN dbo.tblPullDownStates st WITH (NOLOCK) ON st.PullDownStateID=sc.StateID
      WHERE cc.ClusterID IS NOT NULL ORDER BY cc.ClusterID,sc.City,st.PullDownState,cc.ClusterCityID`),
    queryReadOnly<ClusterCityOption>(`SELECT sc.PullDownStateCityID id,ISNULL(sc.City,'') city,
      ISNULL(st.PullDownState,'') state FROM dbo.tblPullDownStateCities sc WITH (NOLOCK)
      LEFT JOIN dbo.tblPullDownStates st WITH (NOLOCK) ON st.PullDownStateID=sc.StateID
      WHERE ISNULL(sc.PullDownStateCityActive,1)=1 ORDER BY sc.City,st.PullDownState`),
  ]);
  return { clusters, cities, cityOptions };
}
