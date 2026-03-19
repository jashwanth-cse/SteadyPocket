/**
 * Utility to download data as a CSV file
 * @param data Array of objects to export
 * @param filename Name of the file (e.g., 'riders-report')
 */
export const downloadCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert('No data available to export');
    return;
  }

  // 1. Get Headers
  const headers = Object.keys(data[0]);

  // 2. Format Rows
  const rows = data.map(item => {
    return headers.map(header => {
      let val = item[header];
      
      // Handle null/undefined
      if (val === null || val === undefined) return '""';
      
      // Handle Firebase Timestamps or Dates
      if (val?.toDate) {
        val = val.toDate().toLocaleString();
      } else if (val instanceof Date) {
        val = val.toLocaleString();
      } else if (typeof val === 'object') {
        // Flatten shallow objects or stringify complex ones
        val = JSON.stringify(val).replace(/"/g, '""');
      }

      // Escape quotes and wrap in quotes for CSV safety
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    }).join(',');
  });

  // 3. Combine Headers and Rows
  const csvContent = [headers.join(','), ...rows].join('\n');

  // 4. Create Download Link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
