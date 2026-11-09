import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

export const sourceLocales = ["en", "zh-CN", "zh-TW"]

// Fork-maintained translations take priority over downloaded upstream archives.
export function snapshotSourceLocales(root, snapshot) {
  for (const locale of sourceLocales) {
    const from = path.join(root, locale)
    if (!fs.existsSync(path.join(from, "index.json"))) {
      throw new Error(`Missing maintained locale: ${locale}`)
    }
    fs.cpSync(from, path.join(snapshot, locale), { recursive: true })
  }
}

export function restoreSourceLocales(root, snapshot) {
  for (const locale of sourceLocales) {
    fs.cpSync(path.join(snapshot, locale), path.join(root, locale), {
      recursive: true,
    })
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [operation, snapshot] = process.argv.slice(2)
  if (!snapshot || !["snapshot", "restore"].includes(operation)) {
    throw new Error("Usage: source-locales.mjs snapshot|restore SNAPSHOT_DIR")
  }
  const action =
    operation === "snapshot" ? snapshotSourceLocales : restoreSourceLocales
  action(path.resolve("src/lang"), path.resolve(snapshot))
}
