// frontend/src/pages/admin/PTTM/PTTMContainer.jsx

import { useMemo, useRef, useState } from 'react';
import { PTTMProvider, useApp } from './context/PTTMContext';
import AppBar from './components/AppBar';
import Ribbon from './components/Ribbon';
import ViewTabs from './components/ViewTabs';
import FilterBar from './components/FilterBar';
import StatusBar from './components/StatusBar';
import Toast from './components/Toast';
import ContextMenu from './components/ContextMenu';
import ManagePanel from './components/ManagePanel';
import TaskGrid from './views/TaskGrid';
import SummaryView from './views/SummaryView';
import PhaseView from './views/PhaseView';
import WorkloadView from './views/WorkloadView';
import DailyLog from './views/DailyLog';
import DocFlow from './views/DocFlow';
import Dashboard from './views/Dashboard';
import ReviewPanel from './views/ReviewPanel';
import { parseCSV, exportCSV } from './utils/exportCsv';
import './PTTM.css';

const emptyFilters = { project_id: '', phase_id: '', module_id: '', team_id: '', assigned_user_id: '', status: '', date_from: '', date_to: '', search: '' };

function PTTMApp() {
  const app = useApp();
  const gridRef = useRef(null);
  const importRef = useRef(null);
  const [view, setView] = useState('dashboard');
  const [filters, setFilters] = useState(emptyFilters);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState('phases');
  const [panelPhaseProjectId, setPanelPhaseProjectId] = useState('');
  const [cell, setCell] = useState({ r: 0, c: 0 });
  const [menu, setMenu] = useState(null);
  const [docProject, setDocProject] = useState('');

  // Count tasks pending review for the badge on the Review tab
  const pendingReviewCount = useMemo(
    () => app.tasks.filter(t => t.review_status === 'Pending Review').length,
    [app.tasks]
  );

  // Premium Custom Sheet Height Resizer logic
  const containerRef = useRef(null);
  const [pttmHeight, setPttmHeight] = useState(() => {
    return parseInt(localStorage.getItem('pttm-height'), 10) || 580;
  });

  const startContainerResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const containerEl = containerRef.current;
    if (!containerEl) return;
    
    const containerTop = containerEl.getBoundingClientRect().top;
    
    const onMouseMove = (moveEvent) => {
      const newHeight = Math.max(300, Math.min(1000, moveEvent.clientY - containerTop));
      setPttmHeight(newHeight);
      localStorage.setItem('pttm-height', newHeight);
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'ns-resize';
  };

  const filteredRows = useMemo(() => app.tasks.filter(task => {
    if (filters.project_id && String(task.project_id) !== String(filters.project_id)) return false;
    if (filters.phase_id && String(task.phase_id) !== String(filters.phase_id)) return false;
    if (filters.module_id && String(task.module_id) !== String(filters.module_id)) return false;
    if (filters.team_id && String(task.team_id) !== String(filters.team_id)) return false;
    if (filters.assigned_user_id && String(task.assigned_user_id) !== String(filters.assigned_user_id)) return false;
    if (filters.status && task.status !== filters.status) return false;
    if (filters.date_from && (task.date || '') < filters.date_from) return false;
    if (filters.date_to && (task.date || '') > filters.date_to) return false;
    const q = filters.search.trim().toLowerCase();
    if (q) {
      const hay = [
        task.task_title,
        task.description,
        task.remarks,
        app.projectName(task.project_id),
        app.phaseName(task.phase_id),
        app.moduleName(task.module_id),
        app.teamName(task.team_id),
        app.userName(task.assigned_user_id)
      ].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [app.tasks, filters, app.projects, app.phases, app.modules, app.teams, app.users]);

  const openPanel = (tab, options = {}) => {
    setPanelTab(tab);
    setPanelPhaseProjectId(tab === 'phases' ? (options.project_id || '') : '');
    setPanelOpen(true);
  };

  const cellAddr = cell ? `${String.fromCharCode(65 + cell.c)}${cell.r + 1}` : 'A1';
  const onSeed = async () => {
    if (window.confirm('Reset all data to sample data?')) await app.runSeed();
  };

  const exportCsv = () => {
    const header = ['Date', 'Project', 'Phase', 'Team', 'Assigned To', 'Team Leader', 'Task Title', 'Description', 'Status', 'Remarks'];
    const rows = filteredRows.map(t => [
      t.date || '',
      app.projectName(t.project_id),
      app.phaseName(t.phase_id),
      app.teamName(t.team_id),
      app.userName(t.assigned_user_id),
      app.userName(t.team_leader_id),
      t.task_title || '',
      t.description || '',
      t.status || '',
      t.remarks || ''
    ]);
    const csvData = [header, ...rows];
    exportCSV(csvData, `AITS_Tasks_${new Date().toISOString().slice(0, 10)}.csv`);
    app.showToast(`Exported ${rows.length} tasks`);
  };

  const importCsv = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async event => {
      const text = event.target.result;
      try {
        const parsed = parseCSV(text);
        const projectByName = new Map(app.projects.map(p => [p.name.toLowerCase(), p]));
        const teamByName = new Map(app.teams.map(t => [t.name.toLowerCase(), t]));
        const phaseByName = new Map(app.phases.map(p => [p.name.toLowerCase(), p]));
        const userByName = new Map(app.users.map(u => [u.name.toLowerCase(), u]));
        
        let count = 0;
        for (const row of parsed) {
          const rowProject = row.Project || row.project || '';
          const rowTeam = row.Team || row.team || '';
          const rowPhase = row.Phase || row.phase || '';
          const rowUser = row['Assigned To'] || row.assigned_to || row.AssignedTo || '';
          const rowLeader = row['Team Leader'] || row.team_leader || row.TeamLeader || '';
          const rowDate = row.Date || row.date || '';
          const rowTitle = row['Task Title'] || row.task_title || row.TaskTitle || '';
          const rowDesc = row.Description || row.description || '';
          const rowStatus = row.Status || row.status || 'Pending';
          const rowRemarks = row.Remarks || row.remarks || '';

          let project = findBy(projectByName, rowProject);
          if (!project && rowProject) {
            app.showToast(`Project "${rowProject}" not found, please create it in Service Management first`);
            continue; // Skip this row if project doesn't exist
          }
          let team = findBy(teamByName, rowTeam);
          if (!team && rowTeam) {
            team = await app.saveTeam({ name: rowTeam, project_id: project?.id || null });
            teamByName.set(team.name.toLowerCase(), team);
          }
          let phase = findBy(phaseByName, rowPhase);
          if (!phase && rowPhase && project?.id) {
            phase = await app.savePhase({ name: rowPhase, project_id: project.id, order_num: 1, description: '' });
            phaseByName.set(phase.name.toLowerCase(), phase);
          }
          let user = findBy(userByName, rowUser);
          if (!user && rowUser) {
            app.showToast(`Employee "${rowUser}" not found, skipping assignment`);
          }
          let leader = findBy(userByName, rowLeader);
          if (!leader && rowLeader) {
            app.showToast(`Employee "${rowLeader}" not found, skipping leader assignment`);
          }
          await app.addTask({ 
            project_id: project?.id || null, 
            phase_id: phase?.id || null, 
            team_id: team?.id || null, 
            assigned_user_id: user?.id || null, 
            team_leader_id: leader?.id || null,
            date: rowDate, 
            task_title: rowTitle, 
            description: rowDesc, 
            status: rowStatus, 
            remarks: rowRemarks 
          });
          count++;
        }
        await app.fetchAll();
        app.showToast(`Imported ${count} rows`);
      } catch (err) {
        app.showToast(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    importRef.current.value = '';
  };

  const mainView = () => {
    if (view === 'grid') return <TaskGrid ref={gridRef} rows={filteredRows} cell={cell} setCell={setCell} onMenu={(x, y, row) => setMenu({ x, y, row })} />;
    if (view === 'review') return <ReviewPanel />;
    return (
      <div id="panel-views" className="on">
        <div className={`vp ${view === 'dashboard' ? 'on' : ''}`}><Dashboard switchGrid={() => setView('grid')} /></div>
        <div className={`vp ${view === 'summary' ? 'on' : ''}`}><SummaryView openDocFlow={id => { setDocProject(id); setView('docflow'); }} openProjectTeams={id => { setFilters(f => ({ ...f, project_id: id })); setView('workload'); }} openProjectPhases={id => { setFilters(f => ({ ...f, project_id: id })); setView('phases'); }} openAddPhase={id => openPanel('phases', { project_id: id })} /></div>
        <div className={`vp ${view === 'phases' ? 'on' : ''}`}><PhaseView filters={filters} setFilters={setFilters} switchGrid={() => setView('grid')} onOpenPanel={openPanel} /></div>
        <div className={`vp ${view === 'workload' ? 'on' : ''}`}><WorkloadView filters={filters} setFilters={setFilters} switchGrid={() => setView('grid')} /></div>
        <div className={`vp ${view === 'daily' ? 'on' : ''}`}><DailyLog /></div>
        <div className={`vp ${view === 'docflow' ? 'on' : ''}`}><DocFlow selectedProjectId={docProject} setSelectedProjectId={setDocProject} /></div>
      </div>
    );
  };

  return (
    <div 
      className="pttm-container" 
      ref={containerRef} 
      style={{ height: "100vh" }}
      onClick={() => setMenu(null)}
    >
      <div className="app-shell">
        <AppBar onOpenPanel={openPanel} />
        <Ribbon cellAddr={cellAddr} onAddRow={() => gridRef.current?.addRow()} onDuplicate={() => gridRef.current?.duplicate()} onDelete={() => gridRef.current?.remove()} onOpenPanel={openPanel} onExport={exportCsv} onImport={() => importRef.current?.click()} onSeed={onSeed} />
        <ViewTabs view={view} onChange={setView} pendingReviewCount={pendingReviewCount} />
        {view !== 'docflow' && view !== 'dashboard' && <FilterBar filters={filters} setFilters={setFilters} rowCount={filteredRows.length} />}
        <div id="main">{mainView()}</div>
        <StatusBar onResizeStart={startContainerResize} />
        <ManagePanel open={panelOpen} tab={panelTab} setTab={setPanelTab} onClose={() => setPanelOpen(false)} phaseProjectId={panelPhaseProjectId} />
        <ContextMenu menu={menu} onClose={() => setMenu(null)} onAbove={() => gridRef.current?.insertAbove(menu.row)} onBelow={() => gridRef.current?.insertBelow(menu.row)} onDuplicate={() => gridRef.current?.duplicate()} onDelete={() => gridRef.current?.remove()} />
        <Toast message={app.toast} />
        <input ref={importRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={importCsv} />
      </div>
    </div>
  );
}

function findBy(map, name) {
  return name ? map.get(String(name).trim().toLowerCase()) : null;
}

export default function PTTMContainer() {
  return (
    <PTTMProvider>
      <PTTMApp />
    </PTTMProvider>
  );
}
