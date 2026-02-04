const CSV_SEPARATOR = ';';
const CSV_LINE_BREAK = '\r\n';

const normalizeValue = (value: unknown) => {
  if (value === null || value === undefined) return '';
  const normalized = String(value).normalize('NFC');
  const withoutControlChars = normalized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return withoutControlChars.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
};

const escapeCsvValue = (value: unknown) => {
  const normalized = normalizeValue(value);
  const shouldQuote =
    normalized.includes(CSV_SEPARATOR) || normalized.includes('\n') || normalized.includes('"');
  const escaped = normalized.replace(/"/g, '""');
  return shouldQuote ? `"${escaped}"` : escaped;
};

export type CsvColumn = {
  key: string;
  header: string;
};

export const exportToCsv = ({
  filename,
  rows,
  columns,
}: {
  filename: string;
  rows: Array<Record<string, unknown>>;
  columns: CsvColumn[];
}) => {
  const headerLine = columns.map((column) => escapeCsvValue(column.header)).join(CSV_SEPARATOR);
  const dataLines = rows.map((row) =>
    columns.map((column) => escapeCsvValue(row[column.key])).join(CSV_SEPARATOR)
  );
  const csvContent = `\uFEFFsep=${CSV_SEPARATOR}${CSV_LINE_BREAK}${[headerLine, ...dataLines].join(
    CSV_LINE_BREAK
  )}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
