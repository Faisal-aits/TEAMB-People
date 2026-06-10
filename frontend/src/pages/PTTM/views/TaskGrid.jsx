// frontend/src/pages/admin/PTTM/views/TaskGrid.jsx

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { useApp } from '../context/PTTMContext';

const cols = [
  ['date', 'Date'],
  ['project_id', 'Project'],
  ['phase_id', 'Phase'],
  ['module_id', 'Module'],
  ['team_id', 'Team'],
  ['assigned_user_id', 'Assigned To'],
  ['team_leader_id', 'Team Leader'],
  ['task_title', 'Task Title'],
  ['description', 'Description'],
  ['status', 'Status'],
  ['remarks', 'Remarks']
];
const statusKey = { Completed: 'C', 'In Progress': 'I', Pending: 'P', 'Not Started': 'N', 'On Going': 'O', 'Under Review': 'R' };
const statusOptions = ['Pending', 'In Progress', 'Completed', 'Not Started', 'On Going', 'Under Review'];

const TaskGrid = forwardRef(function TaskGrid({ rows, cell, setCell, onMenu }, ref) {
  const app = useApp();
  const [edit, setEdit] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [sort, setSort] = useState({ col: 'date', dir: 'asc' });
  const [clipboard, setClipboard] = useState('');

  // Premium Real-time Column Widths & Row Heights Resize state
  const [colWidths, setColWidths] = useState({
    0: 42,
    1: 100,
    2: 150,
    3: 130,
    4: 140, // Module column width
    5: 130,
    6: 130,
    7: 130, // Team Leader column width
    8: 175,
    9: 250,
    10: 110,
    11: 200
  });
  const [rowHeights, setRowHeights] = useState({});

  // Premium Excel Cell Auto-Fill Drag-Down State
  const [dragFillStart, setDragFillStart] = useState(null); // { r, c }
  const [dragFillEnd, setDragFillEnd] = useState(null); // { r, c }

  const startColResize = (e, colIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startWidth = colWidths[colIndex];
    
    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(35, startWidth + deltaX);
      setColWidths(prev => ({
        ...prev,
        [colIndex]: newWidth
      }));
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const startRowResize = (e, rowIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startY = e.clientY;
    const startHeight = rowHeights[rowIndex] || 28;
    
    const onMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(18, startHeight + deltaY);
      setRowHeights(prev => ({
        ...prev,
        [rowIndex]: newHeight
      }));
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'row-resize';
  };

  const autoFitCol = (colIndex) => {
    if (colIndex === 0) {
      const maxDigits = String(rows.length).length;
      setColWidths(prev => ({
        ...prev,
        0: Math.max(42, maxDigits * 9 + 20)
      }));
      return;
    }
    
    const colKey = cols[colIndex - 1][0];
    const colLabel = cols[colIndex - 1][1];
    
    let maxLength = colLabel.length;
    rows.forEach(r => {
      const val = displayValue(r, colKey, app);
      if (val) maxLength = Math.max(maxLength, String(val).length);
    });
    
    const fitWidth = Math.min(500, Math.max(60, maxLength * 8 + 30));
    setColWidths(prev => ({
      ...prev,
      [colIndex]: fitWidth
    }));
  };

  const autoFitRow = (rowIndex) => {
    setRowHeights(prev => ({
      ...prev,
      [rowIndex]: 28
    }));
  };

  const startFillDrag = (e, r, c) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragFillStart({ r, c });
    setDragFillEnd({ r, c });
    
    const onMouseMove = (moveEvent) => {
      const element = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      const td = element?.closest('td');
      if (td) {
        const targetR = parseInt(td.getAttribute('data-r'), 10);
        const targetC = parseInt(td.getAttribute('data-c'), 10);
        if (!isNaN(targetR) && !isNaN(targetC) && targetC === c) {
          setDragFillEnd({ r: targetR, c: targetC });
        }
      }
    };
    
    const onMouseUp = async () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      if (dragFillEnd) {
        const sourceTask = sortedRows[r];
        const colKey = cols[c][0];
        const fillValue = sourceTask[colKey] || '';
        
        const minR = Math.min(r, dragFillEnd.r);
        const maxR = Math.max(r, dragFillEnd.r);
        
        let count = 0;
        for (let i = minR; i <= maxR; i++) {
          if (i === r) continue;
          const targetTask = sortedRows[i];
          if (targetTask) {
            await commit(targetTask, colKey, fillValue);
            count++;
          }
        }
        if (count > 0) {
          app.showToast(`Auto-filled ${count} cells in ${cols[c][1]} column!`);
        }
      }
      
      setDragFillStart(null);
      setDragFillEnd(null);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const isDragFillHighlighted = (ri, ci) => {
    if (!dragFillStart || !dragFillEnd) return false;
    if (ci !== dragFillStart.c) return false;
    const minR = Math.min(dragFillStart.r, dragFillEnd.r);
    const maxR = Math.max(dragFillStart.r, dragFillEnd.r);
    return ri >= minR && ri <= maxR;
  };

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let av = displayValue(a, sort.col, app);
      let bv = displayValue(b, sort.col, app);
      const cmp = String(av || '').localeCompare(String(bv || ''));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [rows, sort, app.projects, app.phases, app.teams, app.users]);

  const addRow = async (afterIndex = null, beforeIndex = null) => {
    const refRow = sortedRows[selectedRow ?? sortedRows.length - 1];
    const task = {
      project_id: refRow?.project_id || null,
      phase_id: refRow?.phase_id || null,
      team_id: refRow?.team_id || null,
      assigned_user_id: null,
      date: new Date().toISOString().slice(0, 10),
      task_title: '',
      description: '',
      status: 'Pending',
      remarks: ''
    };
    await app.insertTask({ task, after_id: afterIndex !== null ? sortedRows[afterIndex]?.id : null, before_id: beforeIndex !== null ? sortedRows[beforeIndex]?.id : null });
    setCell({ r: Math.max(0, sortedRows.length), c: 0 });
    setEdit({ r: Math.max(0, sortedRows.length), c: 0 });
  };

  const duplicate = async () => {
    const row = sortedRows[selectedRow ?? cell?.r];
    if (!row) return app.showToast('Select a row first');
    await app.duplicateTask(row.id);
  };
  const remove = async () => {
    const row = sortedRows[selectedRow ?? cell?.r];
    if (!row) return app.showToast('Select a row first');
    if (!window.confirm('Delete this task row?')) return;
    await app.deleteTask(row.id);
    setCell(null);
    setSelectedRow(null);
  };

  useImperativeHandle(ref, () => ({
    addRow: () => addRow(),
    duplicate,
    remove,
    insertAbove: index => addRow(null, index),
    insertBelow: index => addRow(index, null),
    selectedRow
  }));

  const commit = async (task, col, value) => {
    await app.patchTask(task.id, col, value);
    setEdit(null);
  };
  const clearCell = async (r, c) => {
    const task = sortedRows[r];
    if (!task) return;
    await commit(task, cols[c][0], '');
  };
  const copyCell = async (r, c) => {
    const task = sortedRows[r];
    if (!task) return;
    const value = displayValue(task, cols[c][0], app);
    setClipboard(value);
    await navigator.clipboard?.writeText(value).catch(() => {});
    document.querySelector(`td[data-r="${r}"][data-c="${c}"]`)?.classList.add('copy-flash');
    setTimeout(() => document.querySelector(`td[data-r="${r}"][data-c="${c}"]`)?.classList.remove('copy-flash'), 300);
    app.showToast(`Copied: ${value}`);
  };
  const pasteCell = async (r, c) => {
    if (!clipboard) return;
    const task = sortedRows[r];
    if (task) await commit(task, cols[c][0], clipboard);
  };

  useEffect(() => {
    const onKey = e => {
      if (edit) return;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (!cell) return;
      let { r, c } = cell;
      if (e.key === 'ArrowDown') { r = Math.min(r + 1, sortedRows.length - 1); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { r = Math.max(r - 1, 0); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { c = Math.min(c + 1, cols.length - 1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { c = Math.max(c - 1, 0); e.preventDefault(); }
      else if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); setEdit({ r, c }); return; }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); clearCell(r, c); return; }
      else if (e.key === 'Tab') { c = e.shiftKey ? Math.max(c - 1, 0) : Math.min(c + 1, cols.length - 1); e.preventDefault(); }
      else if (e.ctrlKey && e.key.toLowerCase() === 'c') { e.preventDefault(); copyCell(r, c); return; }
      else if (e.ctrlKey && e.key.toLowerCase() === 'v') { e.preventDefault(); pasteCell(r, c); return; }
      else if (e.ctrlKey && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicate(); return; }
      else return;
      setCell({ r, c });
      setSelectedRow(r);
      setTimeout(() => document.querySelector(`td[data-r="${r}"][data-c="${c}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' }), 0);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cell, edit, sortedRows, clipboard]);

  const sortBy = key => setSort(s => s.col === key ? { col: key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col: key, dir: 'asc' });

  return (
    <>
      <div id="grid-wrap">
        <table id="grid">
          <colgroup>
            {Array.from({ length: 11 }).map((_, i) => (
              <col key={i} style={{ width: colWidths[i] }} />
            ))}
          </colgroup>
          <thead>
            <tr id="hdr">
              <th style={{ cursor: 'default', textAlign: 'center', position: 'relative' }}>
                #
                <div 
                  className="col-resize-handle" 
                  onMouseDown={(e) => startColResize(e, 0)} 
                  onDoubleClick={() => autoFitCol(0)}
                  onClick={(e) => e.stopPropagation()}
                />
              </th>
              {cols.map(([key, label], ci) => (
                <th 
                  key={key} 
                  onClick={() => sortBy(key)} 
                  data-c={key} 
                  className={sort.col === key ? (sort.dir === 'asc' ? 'sa' : 'sd') : ''}
                  style={{ position: 'relative' }}
                >
                  {label} <span className="si" />
                  <div 
                    className="col-resize-handle" 
                    onMouseDown={(e) => startColResize(e, ci + 1)} 
                    onDoubleClick={() => autoFitCol(ci + 1)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody id="gbody">
            {sortedRows.map((task, ri) => (
              <tr 
                key={task.id} 
                data-id={task.id} 
                className={selectedRow === ri ? 'sel' : ''} 
                style={{ height: rowHeights[ri] || 28 }}
                onContextMenu={e => { e.preventDefault(); setSelectedRow(ri); setCell({ r: ri, c: cell?.c ?? 0 }); onMenu(e.clientX, e.clientY, ri); }}
              >
                <td 
                  className="rn" 
                  onClick={() => { setSelectedRow(ri); setCell({ r: ri, c: cell?.c ?? 0 }); }}
                  style={{ position: 'relative' }}
                >
                  {ri + 1}
                  <div 
                    className="row-resize-handle" 
                    onMouseDown={(e) => startRowResize(e, ri)} 
                    onDoubleClick={() => autoFitRow(ri)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                {cols.map(([key], ci) => {
                  const active = cell?.r === ri && cell?.c === ci;
                  const editing = edit?.r === ri && edit?.c === ci;
                  const highlighted = isDragFillHighlighted(ri, ci);
                  return (
                    <td 
                      key={key} 
                      data-r={ri} 
                      data-c={ci} 
                      data-k={key} 
                      className={`${active ? 'ac' : ''} ${selectedRow === ri ? 'sel' : ''} ${highlighted ? 'drag-fill-highlight' : ''}`} 
                      onClick={e => { e.stopPropagation(); if (active) setEdit({ r: ri, c: ci }); else { setCell({ r: ri, c: ci }); setSelectedRow(ri); } }} 
                      onDoubleClick={e => { e.stopPropagation(); setEdit({ r: ri, c: ci }); }}
                    >
                      {editing ? (
                        <EditCell 
                          task={task} 
                          col={key} 
                          commit={commit} 
                          onDone={() => setEdit(null)} 
                          r={ri} 
                          c={ci} 
                          setEdit={setEdit} 
                          rows={sortedRows} 
                        />
                      ) : (
                        <>
                          <DisplayCell task={task} col={key} app={app} />
                          {active && (
                            <div 
                              className="fill-handle" 
                              onMouseDown={(e) => startFillDrag(e, ri, ci)}
                              onClick={e => e.stopPropagation()}
                              title="Drag down to auto-fill"
                            />
                          )}
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
            <tr style={{ background: '#eaeaea', fontWeight: 'bold', borderTop: '2px solid var(--border-h)', height: 28 }}>
              <td className="rn" style={{ background: '#ebebeb', fontSize: '13px', fontWeight: 'bold' }}>Σ</td>
              <td style={{ color: '#333' }}>Total: {rows.length}</td>
              <td style={{ color: '#333' }}>Pj: {app.projects.length}</td>
              <td style={{ color: '#333' }}>Ph: {app.phases.length}</td>
              <td style={{ color: '#333' }}>Md: {(app.modules || []).length}</td>
              <td style={{ color: '#333' }}>Tm: {app.teams.length}</td>
              <td style={{ color: '#333' }}>Usr: {app.users.length}</td>
              <td style={{ color: '#333' }}>Ldrs: {app.users.filter(u => u.role === 'Team Lead' || u.role === 'Manager').length || 1}</td>
              <td colSpan="2" style={{ color: '#555', fontSize: '11px', fontStyle: 'italic', textAlign: 'center' }}>Excel Sheet Totals Summary</td>
              <td style={{ verticalAlign: 'middle', padding: '0 4px' }}>
                <div style={{ display: 'inline-flex', gap: '5px', fontSize: '11px' }}>
                  <span className="sb sC" style={{ padding: '0 4px' }}>C: {rows.filter(t => t.status === 'Completed').length}</span>
                  <span className="sb sI" style={{ padding: '0 4px' }}>I: {rows.filter(t => t.status === 'In Progress').length}</span>
                  <span className="sb sP" style={{ padding: '0 4px' }}>P: {rows.filter(t => t.status === 'Pending').length}</span>
                </div>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
        <div id="add-row" onClick={() => addRow()}>＋ Click here or press Enter on last row to add a new task row</div>
      </div>
    </>
  );
});

function DisplayCell({ task, col, app }) {
  if (col === 'status') {
    const canSubmit =
      (task.status === 'In Progress' || task.status === 'Pending') &&
      task.review_status !== 'Pending Review';
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span className={`sb s${statusKey[task.status] || 'N'}`}>{task.status || ''}</span>
        {canSubmit && (
          <button
            title="Submit this task for team leader review"
            onClick={async e => {
              e.stopPropagation();
              if (window.confirm('Submit this task for team leader review?')) {
                await app.submitForReview(task.id);
              }
            }}
            style={{
              padding: '2px 8px',
              fontSize: 10,
              fontWeight: 700,
              background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
              color: '#fff',
              border: 'none',
              borderRadius: 20,
              cursor: 'pointer',
              letterSpacing: '0.2px',
              whiteSpace: 'nowrap',
            }}
          >
            ➤ Submit for Review
          </button>
        )}
        {task.review_status === 'Pending Review' && (
          <span style={{
            padding: '2px 8px', fontSize: 10, fontWeight: 700,
            background: '#fef3c7', color: '#92400e',
            border: '1px solid #fcd34d', borderRadius: 20,
          }}>
            ⏳ Awaiting Review
          </span>
        )}
        {task.review_status === 'Rejected' && (
          <span
            title={task.review_notes || 'Rejected'}
            style={{
              padding: '2px 8px', fontSize: 10, fontWeight: 700,
              background: '#fee2e2', color: '#991b1b',
              border: '1px solid #fca5a5', borderRadius: 20,
              cursor: 'help',
            }}
          >
            ✗ Rejected
          </span>
        )}
      </span>
    );
  }
  if (col === 'phase_id' && task.phase_id) return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 7px', borderRadius: 10, fontSize: 11, fontWeight: 500, background: '#e0d9fb', color: '#3d0c91', whiteSpace: 'nowrap' }}>{app.phaseName(task.phase_id)}</span>;
  if (col === 'module_id' && task.module_id) return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 7px', borderRadius: 10, fontSize: 11, fontWeight: 500, background: '#d1fae5', color: '#065f46', whiteSpace: 'nowrap' }}>{app.moduleName(task.module_id)}</span>;
  return displayValue(task, col, app);
}

function EditCell({ task, col, commit, r, c, setEdit, rows }) {
  const app = useApp();
  const [value, setValue] = useState(task[col] || '');
  useEffect(() => {
    setTimeout(() => document.querySelector(`td[data-r="${r}"][data-c="${c}"] input,td[data-r="${r}"][data-c="${c}"] select`)?.focus(), 15);
  }, [r, c]);
  const submit = async val => commit(task, col, val);
  const keyDown = async e => {
    if (e.key === 'Escape') { setEdit(null); return; }
    if (e.key === 'Tab') { e.preventDefault(); await submit(value); setEdit({ r, c: e.shiftKey ? Math.max(c - 1, 0) : Math.min(c + 1, cols.length - 1) }); }
    if (e.key === 'Enter') { e.preventDefault(); await submit(value); if (r + 1 < rows.length) setEdit({ r: r + 1, c }); }
  };
  const common = { className: col === 'date' ? 'ci' : 'ci', value, onChange: e => setValue(e.target.value), onBlur: () => submit(value), onKeyDown: keyDown };
  if (col === 'project_id') return <Select value={value} onChange={submit} options={app.projects.map(p => [p.id, p.name])} />;
  if (col === 'phase_id') return <Select value={value} onChange={submit} options={app.phases.filter(p => !task.project_id || p.project_id == task.project_id).sort((a, b) => (a.order_num || 0) - (b.order_num || 0)).map(p => [p.id, p.name])} />;
  if (col === 'module_id') return <Select value={value} onChange={submit} options={(app.modules || []).filter(m => !task.project_id || m.project_id == task.project_id).sort((a, b) => (a.order_num || 0) - (b.order_num || 0)).map(m => [m.id, m.name])} />;
  if (col === 'team_id') return <Select value={value} onChange={submit} options={app.teams.filter(t => !task.project_id || t.project_id == task.project_id).map(t => [t.id, t.name])} />;
  if (col === 'assigned_user_id') return <Select value={value} onChange={submit} options={app.users.map(u => [u.id, `${u.name}${u.role ? ` (${u.role})` : ''}`])} />;
  if (col === 'team_leader_id') return <Select value={value} onChange={submit} options={app.users.map(u => [u.id, `${u.name}${u.role ? ` (${u.role})` : ''}`])} />;
  if (col === 'status') return <Select value={value} onChange={submit} options={statusOptions.map(s => [s, s])} />;
  return <input type={col === 'date' ? 'date' : 'text'} {...common} />;
}

function Select({ value, onChange, options }) {
  return <select className="cs" value={value || ''} onChange={e => onChange(e.target.value)} autoFocus><option value="">—</option>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>;
}

function displayValue(task, col, app) {
  if (col === 'project_id') return app.projectName(task[col]);
  if (col === 'phase_id') return app.phaseName(task[col]);
  if (col === 'module_id') return app.moduleName(task[col]);
  if (col === 'team_id') return app.teamName(task[col]);
  if (col === 'assigned_user_id') return app.userName(task[col]);
  if (col === 'team_leader_id') return app.userName(task[col]);
  return task[col] || '';
}

export default TaskGrid;
