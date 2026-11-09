/** Pure visibility rule shared by folder/file views and independent media views. */
export const resolveFileDownloadEnabled = (
  role: number | undefined,
  folderEnabled: boolean | undefined,
  globalValue: string,
) => {
  if (role === 2) return true // UserRole.ADMIN
  if (typeof folderEnabled === "boolean") return folderEnabled
  return globalValue !== "false" && globalValue !== "0"
}
