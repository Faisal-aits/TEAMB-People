// frontend/src/pages/admin/PTTM/views/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/PTTMContext';
import { exportCSV, today } from '../utils/exportCsv';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, LabelList } from 'recharts';

export default function Dashboard({ switchGrid }) {
  const app = useApp();
  const { tasks, projects, phases, teams, users } = app;
  const [docHealth, setDocHealth] = useState([]);
  const [loadingDoc, setLoadingDoc] = useState(false);

  useEffect(() => {
    if (!projects.length) return;
    let mounted = true;
    setLoadingDoc(true);
    Promise.all(projects.map(async p => {
      const rows = await app.getDocflow(p.id);
      return { project: p, rows };
    })).then(results => {
      if (mounted) {
        setDocHealth(results);
        setLoadingDoc(false);
      }
    });
    return () => { mounted = false; };
  }, [projects, app]);

  if (!tasks.length) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <h2 style={{ color: '#333', marginBottom: 8, fontFamily: '"IBM Plex Sans", sans-serif' }}>No data yet</h2>
        <p style={{ color: '#666', marginBottom: 24, fontFamily: '"IBM Plex Sans", sans-serif' }}>Add projects and tasks to see your dashboard.</p>
        <button className="rbtn" onClick={switchGrid} style={{ padding: '8px 16px', fontSize: 14 }}>➕ Go to Task Grid</button>
      </div>
    );
  }

  // --- DATA COMPUTATION ---
  const totTasks = tasks.length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const pending = tasks.filter(t => t.status === 'Pending').length;
  const activeProjects = projects.filter(p => p.status !== 'Completed').length;
  const teamMembers = users.length;

  const pctCompleted = totTasks ? Math.round((completed / totTasks) * 100) : 0;
  const pctIP = totTasks ? Math.round((inProgress / totTasks) * 100) : 0;
  const pctPending = totTasks ? Math.round((pending / totTasks) * 100) : 0;

  const statusCounts = {
    'Completed': completed,
    'In Progress': inProgress,
    'Pending': pending,
    'Not Started': tasks.filter(t => t.status === 'Not Started').length,
    'On Going': tasks.filter(t => t.status === 'On Going').length
  };
  const donutData = Object.keys(statusCounts).filter(k => statusCounts[k] > 0).map(k => ({ name: k, value: statusCounts[k] }));
  const COLORS = { 'Completed': '#217346', 'In Progress': '#0078d4', 'Pending': '#f0ad00', 'Not Started': '#adb5bd', 'On Going': '#6f42c1' };

  const projCompletionData = projects.map(p => {
    const pt = tasks.filter(t => String(t.project_id) === String(p.id));
    const pdone = pt.filter(t => t.status === 'Completed').length;
    const pip = pt.filter(t => t.status === 'In Progress').length;
    const ppend = pt.filter(t => t.status === 'Pending').length;
    const pct = pt.length ? Math.round((pdone / pt.length) * 100) : 0;
    return { name: p.name.length > 18 ? p.name.substring(0, 18) + '...' : p.name, pct, full: p.name, pt: pt.length, done: pdone, ip: pip, pend: ppend };
  }).sort((a, b) => b.pct - a.pct);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysStr = thirtyDaysAgo.toISOString().split('T')[0];
  const tdateGroups = tasks.filter(t => t.date && t.date >= thirtyDaysStr).reduce((acc, t) => {
    acc[t.date] = acc[t.date] || { all: 0, done: 0 };
    acc[t.date].all++;
    if (t.status === 'Completed') acc[t.date].done++;
    return acc;
  }, {});
  const lineData = Object.keys(tdateGroups).sort().map(d => ({ date: d, All: tdateGroups[d].all, Completed: tdateGroups[d].done }));

  const teamWorkload = users.map(u => {
    const ut = tasks.filter(t => t.assigned_user_id === u.id);
    const pdone = ut.filter(t => t.status === 'Completed').length;
    const pip = ut.filter(t => t.status === 'In Progress').length;
    const ppend = ut.filter(t => t.status === 'Pending').length;
    const pother = ut.length - pdone - pip - ppend;
    return { name: u.name.split(' ')[0], fullName: u.name, total: ut.length, Completed: pdone, 'In Progress': pip, Pending: ppend, Other: pother, role: u.role || '' };
  }).sort((a, b) => b.total - a.total).slice(0, 10);

  const projStatusData = projects.map(p => {
    const pt = tasks.filter(t => String(t.project_id) === String(p.id));
    return {
      name: p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name,
      total: pt.length,
      Completed: pt.filter(t => t.status === 'Completed').length,
      'In Progress': pt.filter(t => t.status === 'In Progress').length,
      Pending: pt.filter(t => t.status === 'Pending').length,
      'Not Started': pt.filter(t => t.status === 'Not Started').length,
      'On Going': pt.filter(t => t.status === 'On Going').length
    };
  }).sort((a, b) => b.total - a.total).slice(0, 10);

  const bottlenecksData = phases.map(ph => {
    const pht = tasks.filter(t => t.phase_id === ph.id);
    const blocked = pht.filter(t => t.status === 'Pending' || t.status === 'Not Started').length;
    return { name: ph.name, blocked };
  }).filter(d => d.blocked > 0).sort((a, b) => b.blocked - a.blocked);

  const todayStr = today();
  const atRiskProjects = projects.filter(p => {
    if (p.status !== 'Completed' && p.end_date && p.end_date < todayStr) return true;
    if (p.status === 'In Progress' && p.end_date) {
      const pt = tasks.filter(t => String(t.project_id) === String(p.id));
      const done = pt.filter(t => t.status === 'Completed').length;
      const pct = pt.length ? Math.round((done / pt.length) * 100) : 0;
      const tdate = new Date(todayStr);
      const edate = new Date(p.end_date);
      const diffDays = Math.ceil((edate - tdate) / (1000 * 60 * 60 * 24));
      if (pct < 30 && diffDays >= 0 && diffDays <= 14) return true;
    }
    return false;
  }).map(p => {
    const pt = tasks.filter(t => String(t.project_id) === String(p.id));
    const done = pt.filter(t => t.status === 'Completed').length;
    const pct = pt.length ? Math.round((done / pt.length) * 100) : 0;
    const tdate = new Date(todayStr);
    const edate = new Date(p.end_date || todayStr);
    const diffDays = Math.ceil((edate - tdate) / (1000 * 60 * 60 * 24));
    return { name: p.name, end_date: p.end_date, pct, status: p.status, diffDays };
  });

  const recentTasks = [...tasks].filter(t => t.date).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  const handleExport = () => {
    const arr = [];
    arr.push(['KPI SUMMARY']);
    arr.push(['Metric', 'Value', '%']);
    arr.push(['Total Tasks', totTasks, '']);
    arr.push(['Completed', completed, `${pctCompleted}%`]);
    arr.push(['In Progress', inProgress, `${pctIP}%`]);
    arr.push(['Pending', pending, `${pctPending}%`]);
    arr.push(['Active Projects', activeProjects, '']);
    arr.push(['Team Members', teamMembers, '']);
    arr.push([]);
    
    arr.push(['PROJECT COMPLETION']);
    arr.push(['Project Name', 'Total Tasks', 'Completed', 'In Progress', 'Pending', '% Done']);
    projCompletionData.forEach(p => {
      arr.push([p.full, p.pt, p.done, p.ip, p.pend, `${p.pct}%`]);
    });
    arr.push([]);

    arr.push(['TEAM WORKLOAD']);
    arr.push(['Name', 'Role', 'Total', 'Completed', 'In Progress', 'Pending']);
    teamWorkload.forEach(t => {
      arr.push([t.fullName, t.role, t.total, t.Completed, t['In Progress'], t.Pending]);
    });
    arr.push([]);

    arr.push(['AT-RISK PROJECTS']);
    arr.push(['Project', 'End Date', '% Done', 'Status', 'Days Overdue/Left']);
    atRiskProjects.forEach(p => {
      arr.push([p.name, p.end_date || '', `${p.pct}%`, p.status || '', p.diffDays < 0 ? `${p.diffDays} days` : `${p.diffDays} days left`]);
    });

    exportCSV(arr, `AITS_Dashboard_Summary_${todayStr}.csv`);
  };

  const cardStyle = { background: '#fff', border: '1px solid #d0d0d0', borderRadius: 6, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 14 };
  const sectionTitleStyle = { fontSize: 13, fontWeight: 600, color: '#222', borderBottom: '2px solid #217346', paddingBottom: 5, marginBottom: 12 };
  
  const KpiCard = ({ accent, title, value, pct }) => (
    <div style={{ position: 'relative', background: '#fff', border: '1px solid #d0d0d0', borderRadius: 6, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: accent, borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }} />
      <div style={{ fontSize: 11, color: '#666', marginBottom: 4, paddingLeft: 6 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#333', paddingLeft: 6 }}>{value}</div>
      {pct !== undefined && (
        <div style={{ marginTop: 8, marginLeft: 6, height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: accent }} />
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: 16, background: '#f9f9f9', height: '100%', overflowY: 'auto', fontFamily: '"IBM Plex Sans", sans-serif' }}>
      <style>{`
        .dash-kpi-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; margin-bottom: 14px; }
        @media (max-width: 1000px) { .dash-kpi-grid { grid-template-columns: repeat(3, 1fr); } }
        .dash-row { display: flex; gap: 14px; margin-bottom: 14px; flex-wrap: wrap; }
        .dash-col-40 { flex: 4; min-width: 320px; }
        .dash-col-60 { flex: 6; min-width: 400px; }
        .dash-col-50 { flex: 5; min-width: 320px; }
        .dash-spinner { border: 3px solid rgba(0,0,0,0.1); border-top-color: #217346; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 20px auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .df-health-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
        .recharts-cartesian-axis-tick-value { font-size: 11px; fill: #666; }
        .recharts-legend-item-text { font-size: 11px; color: #666; }
      `}</style>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="vh" style={{ margin: 0, border: 'none', background: 'transparent' }}>📊 Dashboard Overview</div>
        <button className="rbtn" onClick={handleExport}>⬇ Export Dashboard Summary</button>
      </div>

      <div className="dash-kpi-grid">
        <KpiCard accent="#217346" title="📋 Total Tasks" value={totTasks} pct={100} />
        <KpiCard accent="#0a3622" title="✅ Completed" value={`${completed} (${pctCompleted}%)`} pct={pctCompleted} />
        <KpiCard accent="#084298" title="🔄 In Progress" value={inProgress} pct={pctIP} />
        <KpiCard accent="#856404" title="⏳ Pending" value={pending} pct={pctPending} />
        <KpiCard accent="#217346" title="📁 Active Projects" value={activeProjects} />
        <KpiCard accent="#555" title="👤 Team Members" value={teamMembers} />
      </div>

      <div className="dash-row">
        <div className="dash-col-40" style={cardStyle}>
          <div style={sectionTitleStyle}>Task Status Distribution</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={donutData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                {donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />)}
              </Pie>
              <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 24, fontWeight: 700, fill: '#333' }}>{totTasks}</text>
              <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 11, fill: '#666' }}>Tasks</text>
              <Tooltip formatter={(value, name) => [`${value} (${Math.round((value/totTasks)*100)}%)`, name]} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="dash-col-60" style={cardStyle}>
          <div style={sectionTitleStyle}>Project Completion</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={projCompletionData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#eee" />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis dataKey="name" type="category" width={120} tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val) => [`${val}%`, 'Completed']} />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]} barSize={16}>
                {projCompletionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pct >= 80 ? '#217346' : entry.pct >= 40 ? '#0078d4' : '#f0ad00'} />
                ))}
                <LabelList dataKey="pct" position="right" formatter={(v) => `${v}%`} style={{ fontSize: 10, fill: '#666' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dash-row">
        <div className="dash-col-60" style={cardStyle}>
          <div style={sectionTitleStyle}>Daily Task Activity (Last 30 Days)</div>
          {!lineData.length ? (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 13 }}>No task date data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickMargin={10} minTickGap={20} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="All" stroke="#0078d4" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Completed" stroke="#217346" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="dash-col-40" style={cardStyle}>
          <div style={sectionTitleStyle}>Team Workload</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={teamWorkload} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend iconType="circle" />
              <Bar dataKey="Completed" stackId="a" fill="#217346" barSize={20} />
              <Bar dataKey="In Progress" stackId="a" fill="#0078d4" />
              <Bar dataKey="Pending" stackId="a" fill="#f0ad00" />
              <Bar dataKey="Other" stackId="a" fill="#adb5bd" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dash-row">
        <div className="dash-col-60" style={cardStyle}>
          <div style={sectionTitleStyle}>Task Status by Project</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={projStatusData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend iconType="circle" />
              <Bar dataKey="Completed" stackId="a" fill="#217346" barSize={24} />
              <Bar dataKey="In Progress" stackId="a" fill="#0078d4" />
              <Bar dataKey="Pending" stackId="a" fill="#f0ad00" />
              <Bar dataKey="Not Started" stackId="a" fill="#adb5bd" />
              <Bar dataKey="On Going" stackId="a" fill="#6f42c1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="dash-col-40" style={cardStyle}>
          <div style={sectionTitleStyle}>⚠ Phase Bottlenecks</div>
          {!bottlenecksData.length ? (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#217346', fontSize: 14, fontWeight: 500 }}>✅ No bottlenecks found</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={bottlenecksData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#eee" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval={0} />
                <Tooltip formatter={(val) => [val, 'Blocked Tasks']} />
                <Bar dataKey="blocked" fill="#dc3545" radius={[0, 4, 4, 0]} barSize={16}>
                  <LabelList dataKey="blocked" position="right" style={{ fontSize: 11, fill: '#666' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="dash-row">
        <div className="dash-col-50" style={cardStyle}>
          <div style={sectionTitleStyle}>⚠ At-Risk Projects</div>
          {!atRiskProjects.length ? (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#217346', fontSize: 14, fontWeight: 500 }}>✅ All projects on track</div>
          ) : (
            <div style={{ height: 240, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #eee', color: '#666', textAlign: 'left' }}>
                    <th style={{ padding: '8px 4px', fontWeight: 600 }}>Project</th>
                    <th style={{ padding: '8px 4px', fontWeight: 600 }}>End Date</th>
                    <th style={{ padding: '8px 4px', fontWeight: 600 }}>% Done</th>
                    <th style={{ padding: '8px 4px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '8px 4px', fontWeight: 600 }}>Days</th>
                  </tr>
                </thead>
                <tbody>
                  {atRiskProjects.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '8px 4px', fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: '8px 4px' }}>{p.end_date || '—'}</td>
                      <td style={{ padding: '8px 4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 4, background: '#eee', borderRadius: 2 }}><div style={{ width: `${p.pct}%`, height: '100%', background: p.pct > 50 ? '#217346' : '#f0ad00', borderRadius: 2 }}/></div>
                          <span>{p.pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 4px' }}>{p.status}</td>
                      <td style={{ padding: '8px 4px', fontWeight: 600, color: p.diffDays < 0 ? '#dc3545' : '#f0ad00' }}>
                        {p.diffDays < 0 ? `${p.diffDays} days` : `${p.diffDays} days left`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="dash-col-50" style={cardStyle}>
          <div style={sectionTitleStyle}>🕐 Recent Activity</div>
          <div style={{ height: 240, overflowY: 'auto', paddingRight: 4 }}>
            {recentTasks.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '30ch' }}>
                    {t.task_title || 'Untitled Task'}
                  </div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{app.projectName(t.project_id) || 'No Project'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, fontWeight: 500, background: t.status === 'Completed' ? '#d1e7dd' : t.status === 'In Progress' ? '#cff4fc' : t.status === 'Pending' ? '#fff3cd' : '#e2e3e5', color: t.status === 'Completed' ? '#0f5132' : t.status === 'In Progress' ? '#055160' : t.status === 'Pending' ? '#664d03' : '#41464b' }}>
                    {t.status || 'Not Started'}
                  </span>
                  <div style={{ fontSize: 11, color: '#666', minWidth: 65, textAlign: 'right' }}>{t.date}</div>
                </div>
              </div>
            ))}
            {!recentTasks.length && <div style={{ color: '#888', fontSize: 13, textAlign: 'center', marginTop: 20 }}>No recent tasks.</div>}
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitleStyle}>📄 Document Flow Health — All Projects</div>
        {loadingDoc ? (
          <div className="dash-spinner" />
        ) : !docHealth.length ? (
          <div style={{ color: '#888', fontSize: 13, textAlign: 'center', padding: 20 }}>No Document Flow data.</div>
        ) : (
          <div className="df-health-grid">
            {docHealth.map(({ project, rows }) => {
              const total = rows.length || 9;
              const done = rows.filter(r => r.status === 'Completed').length;
              const pct = total ? Math.round((done / total) * 100) : 0;
              return (
                <div key={project.id} style={{ border: '1px solid #eee', borderRadius: 4, padding: 12, background: '#fafafa' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.name}</div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                    {(rows.length ? rows : Array.from({ length: 9 })).map((r, i) => {
                      const status = r?.status || 'Not Started';
                      const color = status === 'Completed' ? '#217346' : status === 'In Progress' ? '#0078d4' : status === 'Waiting for Client' ? '#f0ad00' : '#e0e0e0';
                      return <div key={i} title={status} style={{ width: 14, height: 14, borderRadius: '50%', background: color }} />;
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#555', marginBottom: 4 }}>
                    <span>{done} / {total} complete</span>
                    <span style={{ fontWeight: 600 }}>{pct}%</span>
                  </div>
                  <div style={{ height: 4, background: '#eee', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#217346' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
