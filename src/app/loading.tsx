export default function Loading() {
  return (
    <div className="route-loading-backdrop" role="status" aria-live="polite" aria-label="Loading page data">
      <div className="route-loading-dialog">
        <div className="route-loading-title">MC Labor</div>
        <div className="route-loading-content">
          <strong>Loading data…</strong>
          <span>Please wait while the latest records are fetched.</span>
          <div className="route-loading-track" aria-hidden="true">
            <div className="route-loading-bar" />
          </div>
        </div>
      </div>
    </div>
  );
}
