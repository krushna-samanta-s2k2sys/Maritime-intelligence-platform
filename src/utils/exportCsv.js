// Export filtered table rows as a UTF-8 CSV that opens correctly in Excel.
// getCell(colId, row) → string  (caller adapts their own getCellValue signature)
export function exportToExcel(rows, columns, getCell, filename) {
  const escape = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`

  const header = columns.map(c => escape(c.label)).join(',')
  const body   = rows.map(row =>
    columns.map(c => escape(getCell(c.id, row))).join(',')
  ).join('\r\n')

  const csv  = '﻿' + header + '\r\n' + body   // BOM → Excel UTF-8
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
