// frontend/src/pages/admin/PTTM/components/ViewTabs.jsx

const tabs = [
  ['dashboard', '📊 Dashboard'],
  ['grid', '📋 Task Grid'],
  ['summary', '📈 Project Summary'],
  ['phases', '📍 Phase Progress'],
  ['workload', '👥 Team Workload'],
  ['daily', '📅 Daily Log'],
  ['docflow', '📄 Doc Flow']
];

export default function ViewTabs({ view, onChange }) {
  return (
    <div id="view-tabs">
      {tabs.map(([id, label]) => (
        <div key={id} className={`vtab ${view === id ? 'active' : ''}`} onClick={() => onChange(id)} data-v={id}>
          {label}
        </div>
      ))}
    </div>
  );
}
