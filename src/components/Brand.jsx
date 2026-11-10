export default function Brand({ tone = "dark", slogan = "" }) {
  return (
    <div className={`wordmark on-${tone}`}>
      <div className="wordmark-name">
        <span>Tru</span>Wash
      </div>
      <div className="wordmark-pill">Laundry & Dry Cleaning</div>
      {slogan ? <p className="wordmark-slogan">{slogan}</p> : null}
    </div>
  );
}
