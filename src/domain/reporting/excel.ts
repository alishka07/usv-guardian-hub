// Excel (.xlsx) export — pragmatic placeholder. Today we emit the same content
// as CSV with a UTF-8 BOM and Excel MIME so the file opens directly in Excel.
// A proper .xlsx writer (e.g. exceljs) can replace this when multi-sheet,
// formula-driven workbooks are needed (Gov tier).

import type { Sample, Robot, Thresholds } from "@/domain/types";
import { buildCSV, downloadBlob, type ReportFilters } from "./report";

export function downloadExcel(
  samples: Sample[],
  robots: Robot[],
  thresholds: Thresholds,
  filters: ReportFilters,
) {
  const content = "﻿" + buildCSV(samples, robots, thresholds);
  const fn = `aquawatch_report_${filters.range.from}_${filters.range.to}.csv`;
  downloadBlob(fn, "application/vnd.ms-excel;charset=utf-8", content);
  return { mode: "csv-fallback" as const, filename: fn };
}
