// frontend/src/pages/admin/PTTM/components/ViewTabs.jsx

const tabs = [
  ['dashboard', '📊 Dashboard'],
  ['grid', '📋 Task Grid'],
  ['summary', '📈 Project Summary'],
  ['phases', '📍 Phase Progress'],
  ['workload', '👥 Team Workload'],
  ['daily', '📅 Daily Log'],
  ['docflow', '📄 Doc Flow'],
  ['review', '🔍 Review']
];

export default function ViewTabs({ view, onChange, pendingReviewCount = 0 }) {
  return (
    <div id="view-tabs">
      {tabs.map(([id, label]) => (
        <div
          key={id}
          className={`vtab ${view === id ? 'active' : ''}`}
          onClick={() => onChange(id)}
          data-v={id}
          style={{ position: 'relative' }}
        >
          {label}
          {id === 'review' && pendingReviewCount > 0 && (
            <span style={{
              position: 'absolute',
              top: 2,
              right: 4,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              background: '#ef4444',
              color: '#fff',
              borderRadius: 99,
              fontSize: 10,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              boxShadow: '0 1px 4px rgba(239,68,68,0.5)',
            }}>
              {pendingReviewCount > 99 ? '99+' : pendingReviewCount}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
