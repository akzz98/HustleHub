function LoadingRegion({ loading, label = 'Loading…', children }) {
  return (
    <div className="loading-region" aria-busy={loading ? 'true' : 'false'} aria-live="polite">
      {loading ? <p className="loading-copy">{label}</p> : children}
    </div>
  );
}

export default LoadingRegion;
