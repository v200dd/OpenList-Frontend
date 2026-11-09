import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import {
  sourceLocales,
  snapshotSourceLocales,
  restoreSourceLocales,
} from "./source-locales.mjs"

test("release language downloads do not overwrite maintained Chinese or English", (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "openlist-locales-"))
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }))
  const root = path.join(temp, "lang")
  const snapshot = path.join(temp, "snapshot")
  for (const locale of sourceLocales) {
    fs.mkdirSync(path.join(root, locale), { recursive: true })
    fs.writeFileSync(
      path.join(root, locale, "index.json"),
      JSON.stringify({ lang: locale }),
    )
    fs.writeFileSync(
      path.join(root, locale, "metas.json"),
      JSON.stringify({ download_policy: `source-${locale}` }),
    )
  }
  snapshotSourceLocales(root, snapshot)
  for (const locale of sourceLocales) {
    fs.writeFileSync(
      path.join(root, locale, "metas.json"),
      '{"download_policy":"Download and copy link"}',
    )
  }
  fs.mkdirSync(path.join(root, "fr"))
  fs.writeFileSync(
    path.join(root, "fr", "metas.json"),
    '{"download_policy":"Téléchargement"}',
  )
  restoreSourceLocales(root, snapshot)
  for (const locale of sourceLocales) {
    assert.equal(
      JSON.parse(fs.readFileSync(path.join(root, locale, "metas.json")))
        .download_policy,
      `source-${locale}`,
    )
  }
  assert.match(
    fs.readFileSync(path.join(root, "fr", "metas.json"), "utf8"),
    /Téléchargement/,
  )
})

test("missing maintained language fails the release instead of silently shipping English", (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "openlist-locales-"))
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }))
  assert.throws(
    () => snapshotSourceLocales(temp, path.join(temp, "snapshot")),
    /Missing maintained locale/,
  )
})
