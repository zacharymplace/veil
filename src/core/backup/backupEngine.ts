import { invoke } from "@tauri-apps/api/core";

export type CoreDatabaseStats = {
  database: string;
  bookmarks: number;
  auditEvents: number;
};

export async function getCoreDatabaseStats(): Promise<CoreDatabaseStats> {
  return invoke<CoreDatabaseStats>("db_stats");
}

export async function previewCoreExport(): Promise<string> {
  return invoke<string>("db_export_json");
}

export async function exportCoreBackupFile(): Promise<string> {
  return invoke<string>("db_export_file");
}

export async function importCoreBackupJson(raw: string): Promise<Record<string, number>> {
  return invoke<Record<string, number>>("db_import_json", { raw });
}
