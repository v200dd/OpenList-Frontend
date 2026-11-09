import test from "node:test"
import assert from "node:assert/strict"
import { resolveFileDownloadEnabled } from "./file_download.ts"

test("administrators keep download and copy-link entries regardless of switches", () => {
  for (const global of ["true", "false", "0", ""]) {
    for (const folder of [true, false, undefined]) {
      assert.equal(resolveFileDownloadEnabled(2, folder, global), true)
    }
  }
})

test("folder overrides global default for guests and general users", () => {
  for (const role of [undefined, 0, 1]) {
    assert.equal(resolveFileDownloadEnabled(role, true, "false"), true)
    assert.equal(resolveFileDownloadEnabled(role, false, "true"), false)
  }
})

test("older backends fall back to global default without stale folder state", () => {
  assert.equal(resolveFileDownloadEnabled(1, undefined, "false"), false)
  assert.equal(resolveFileDownloadEnabled(1, undefined, "0"), false)
  assert.equal(resolveFileDownloadEnabled(1, undefined, "true"), true)
  assert.equal(resolveFileDownloadEnabled(1, undefined, ""), true)
})
