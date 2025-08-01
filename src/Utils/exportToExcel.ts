import * as XLSX from 'xlsx';

export function exportToExcel(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Dynamically set column widths based on keys
  const keys = Object.keys(data[0] || {});
  worksheet['!cols'] = keys.map((key) => {
    if (key === 'Player') return { wch: 18 };
    if (key === 'Sub') return { wch: 18 };
    if (key.startsWith('Game')) return { wch: 10 };
    return { wch: 12 };
  });

  // Freeze the header row
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, filename);
} 