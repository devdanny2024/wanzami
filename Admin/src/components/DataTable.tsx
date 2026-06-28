import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, X, type LucideIcon } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { cn } from "./ui/utils";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  // Provide a sort accessor to make the column sortable.
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
  className?: string;
};

export type BulkAction<T> = {
  label: string;
  icon?: LucideIcon;
  onClick: (selected: T[]) => void;
  destructive?: boolean;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  bulkActions?: BulkAction<T>[];
};

type SortState = { key: string; dir: "asc" | "desc" } | null;

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyMessage = "Nothing here yet.",
  bulkActions,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const selectable = Boolean(bulkActions && bulkActions.length > 0);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [rows, sort, columns]);

  const toggleSort = (col: Column<T>) => {
    if (!col.sortValue) return;
    setSort((prev) => {
      if (prev?.key !== col.key) return { key: col.key, dir: "asc" };
      if (prev.dir === "asc") return { key: col.key, dir: "desc" };
      return null;
    });
  };

  const allVisibleKeys = sortedRows.map(rowKey);
  const allSelected = allVisibleKeys.length > 0 && allVisibleKeys.every((k) => selected.has(k));
  const someSelected = allVisibleKeys.some((k) => selected.has(k));

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(allVisibleKeys));
  };
  const toggleRow = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  const selectedRows = sortedRows.filter((r) => selected.has(rowKey(r)));
  const colSpan = columns.length + (selectable ? 1 : 0);

  return (
    <div className="relative">
      {/* Bulk action bar */}
      {selectable && selectedRows.length > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-[#fd7e14]/40 bg-[#fd7e14]/10 px-3 py-2">
          <span className="text-sm text-white">{selectedRows.length} selected</span>
          <div className="flex flex-wrap items-center gap-2">
            {bulkActions!.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => action.onClick(selectedRows)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    action.destructive
                      ? "text-red-300 hover:bg-red-500/15"
                      : "text-neutral-200 hover:bg-white/10"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {action.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={clearSelection}
            className="ml-auto inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-white"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" /> Clear
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-neutral-800">
              {selectable && (
                <th className="w-10 py-3 px-4">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((col) => {
                const isSorted = sort?.key === col.key;
                const ariaSort = !col.sortValue
                  ? undefined
                  : isSorted
                  ? sort!.dir === "asc"
                    ? "ascending"
                    : "descending"
                  : "none";
                return (
                  <th
                    key={col.key}
                    aria-sort={ariaSort}
                    className={cn(
                      "py-3 px-4 text-neutral-400 font-medium",
                      col.align === "right" ? "text-right" : "text-left",
                      col.className
                    )}
                  >
                    {col.sortValue ? (
                      <button
                        onClick={() => toggleSort(col)}
                        className={cn(
                          "inline-flex items-center gap-1.5 hover:text-white transition-colors",
                          col.align === "right" && "flex-row-reverse"
                        )}
                      >
                        {col.header}
                        {!isSorted && <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />}
                        {isSorted && sort!.dir === "asc" && <ChevronUp className="h-3.5 w-3.5" />}
                        {isSorted && sort!.dir === "desc" && <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`sk-${i}`} className="border-b border-neutral-800">
                  {selectable && <td className="py-3 px-4" />}
                  {columns.map((col) => (
                    <td key={col.key} className="py-3 px-4">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-800" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading &&
              sortedRows.map((row) => {
                const key = rowKey(row);
                const isSel = selected.has(key);
                return (
                  <tr
                    key={key}
                    className={cn(
                      "border-b border-neutral-800 transition-colors hover:bg-neutral-800/50",
                      isSel && "bg-[#fd7e14]/5"
                    )}
                  >
                    {selectable && (
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={isSel}
                          onCheckedChange={() => toggleRow(key)}
                          aria-label="Select row"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "py-3 px-4 text-neutral-300",
                          col.align === "right" && "text-right tabular-nums",
                          col.className
                        )}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}

            {!loading && sortedRows.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="py-8 text-center text-neutral-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
