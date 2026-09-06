import React from 'react';

export function DataTable({ columns, data, keyField = 'id', onRowClick }) {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No data available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={col.key || idx} className={col.headerClassName || ''}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr 
              key={row[keyField] || rowIdx} 
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'cursor-pointer hover:bg-surface-variant/20' : ''}
            >
              {columns.map((col, colIdx) => (
                <td key={col.key || colIdx} className={col.cellClassName || ''}>
                  {col.render ? col.render(row, rowIdx) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
