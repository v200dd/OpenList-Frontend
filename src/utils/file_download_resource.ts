import { createResource } from "solid-js"
import { fsGet } from "./api"
import { isFileDownloadEnabled } from "~/store/settings"
import { me } from "~/store/user"
import { password } from "~/store/obj"

/** Media views have their own file paths, not the folder browser's objStore. */
export const createFileDownloadEnabled = (path: () => string | undefined) => {
  const [enabled] = createResource(
    () => {
      const filePath = path()
      if (!filePath || me().role === 2) return undefined
      return {
        filePath,
        basePath: me().base_path,
        user: me().id,
        pwd: password(),
      }
    },
    async ({ filePath, basePath, pwd }) => {
      // Media APIs return absolute VFS paths; fs/get expects a user-relative path.
      const base = basePath?.replace(/\/+$/, "") || ""
      const lowerPath = filePath.toLowerCase()
      const lowerBase = base.toLowerCase()
      const relativePath =
        base &&
        (lowerPath === lowerBase || lowerPath.startsWith(`${lowerBase}/`))
          ? filePath.slice(base.length) || "/"
          : filePath
      try {
        const resp = await fsGet(relativePath, pwd)
        return resp.code === 200
          ? isFileDownloadEnabled(resp.data.enable_file_download ?? null)
          : false
      } catch {
        return false
      }
    },
  )
  return () =>
    me().role === 2 || (!!path() && !enabled.loading && enabled() === true)
}
