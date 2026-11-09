export function CustomerLegacyIcon({ kind }: { kind:"up" | "down" | "delete" | "copy" | "folder" | "search" }) {
  return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges">
    {kind === "up" && <path d="M3.5 7.5 8 3l4.5 4.5h-3v5h-3v-5z" fill="#008080" stroke="#000" />}
    {kind === "down" && <path d="M3.5 8.5 8 13l4.5-4.5h-3v-5h-3v5z" fill="#008080" stroke="#000" />}
    {kind === "delete" && <path d="m3 3 10 10M13 3 3 13M2 3h3M11 3h3M2 13h3M11 13h3" stroke="#000" />}
    {kind === "copy" && <><path d="M1.5 1.5h5l3 3v7h-8z" fill="#fff" stroke="#000"/><path d="M6.5 1.5v3h3M3 4h2M3 6h4M3 8h4M3 10h4" stroke="#000"/><path d="M6.5 5.5h5l3 3v6h-8z" fill="#fff" stroke="#000080"/><path d="M11.5 5.5v3h3M8 8h2M8 10h5M8 12h5" stroke="#000080"/></>}
    {kind === "folder" && <><path d="M1.5 5.5h5l2 2h6v6h-13z" fill="#ffff91" stroke="#000"/><path d="m1.5 13.5 3-6h11l-3 6z" fill="#ffff00" stroke="#000"/></>}
    {kind === "search" && <><path d="M2 5h4v8H1V8h1zM10 5h4v3h1v5h-5zM6 8h4M3 3h2v2M11 3h2v2" stroke="#000"/><path d="M2 9h3v3H2zM11 9h3v3h-3z" fill="#000"/></>}
  </svg>;
}
