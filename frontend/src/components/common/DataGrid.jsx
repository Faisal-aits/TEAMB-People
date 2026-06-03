import React from 'react';
import { AgGridReact } from 'ag-grid-react';

// AG Grid Styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

const DataGrid = ({
  rowData,
  columnDefs,
  onCellValueChanged,
  paginationPageSize = 10,
  ...props
}) => {
  return (
    <div
      className="ag-theme-alpine"
      style={{
        height: '600px',
        width: '100%',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
      }}
    >
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        pagination={true}
        paginationPageSize={paginationPageSize}
        defaultColDef={{
          sortable: true,
          filter: true,
          editable: true,
          flex: 1,
          minWidth: 120,
          resizable: true,
        }}
        animateRows={true}
        rowSelection="multiple"
        onCellValueChanged={onCellValueChanged}
        {...props}
      />
    </div>
  );
};

export default DataGrid;
