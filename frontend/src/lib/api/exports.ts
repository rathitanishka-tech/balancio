import { apiRequestBlob } from "@/lib/api/client";
/**
 * Route note: the spec's assumed contract (section 78) lists
 * `/api/export/groups/:groupId/csv`. The actual splitwise-backend in this
 * project exposes these as `/api/groups/:groupId/export/csv` (nested under
 * the group, consistent with its other group sub-resources like
 * /balances and /debts). This module targets the real backend route
 * rather than the assumed one - exactly the "adapter layer" the spec
 * asks for when shapes differ, so nothing outside this file needs to
 * know about it.
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const exportsApi = {
  async downloadCsv(groupId: string, groupName: string): Promise<void> {
    const { blob, filename } = await apiRequestBlob(`/groups/${groupId}/export/csv`);
    triggerDownload(blob, filename);
  },

  async downloadPdf(groupId: string, groupName: string): Promise<void> {
    const { blob, filename } = await apiRequestBlob(`/groups/${groupId}/export/pdf`);
    triggerDownload(blob, filename);
  }
};
