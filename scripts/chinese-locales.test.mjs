import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const langRoot = path.join(root, "src/lang")
const files = fs
  .readdirSync(path.join(langRoot, "en"))
  .filter((file) => file.endsWith(".json"))
const flatten = (value, prefix = "", out = {}) => {
  for (const [key, item] of Object.entries(value)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (item && typeof item === "object" && !Array.isArray(item))
      flatten(item, fullKey, out)
    else out[fullKey] = item
  }
  return out
}
const readLocale = (locale) =>
  Object.assign(
    {},
    ...files.map((file) =>
      flatten(
        JSON.parse(fs.readFileSync(path.join(langRoot, locale, file))),
        file.replace(/\.json$/, ""),
      ),
    ),
  )
const english = readLocale("en")

test("Chinese dictionaries cover every English source key and every namespace is loaded", () => {
  for (const locale of ["en", "zh-CN", "zh-TW"]) {
    const entry = fs.readFileSync(
      path.join(langRoot, locale, "entry.ts"),
      "utf8",
    )
    for (const file of files)
      assert.ok(
        entry.includes(`"./${file}"`),
        `${locale}: ${file} missing from runtime dictionary`,
      )
    const dict = readLocale(locale)
    for (const key of Object.keys(english))
      assert.ok(
        typeof dict[key] === typeof english[key] &&
          (dict[key] !== "" || english[key] === ""),
        `${locale}: missing ${key}`,
      )
  }
})

test("folder download policies, short links and newly repaired UI labels are Chinese", () => {
  const required = [
    "metas.download_policy",
    "metas.download_policy_inherit",
    "metas.download_policy_enabled",
    "metas.download_policy_disabled",
    "metas.download_policy_help",
    "home.preview.download",
    "home.toolbar.copy_link",
    "home.toolbar.copy_short_link",
    "home.preview.short_link_failed",
    "home.preview.short_link_network",
    "home.preview.short_link_invalid",
    "settings.short_link_api",
    "global.back",
    "global.previous",
    "global.next",
    "global.qr_code",
    "global.theme_color",
    "global.follow_site_default",
    "plugins.root_access",
    "home.preview.search_language",
    "settings_seed.site_config",
  ]
  for (const locale of ["zh-CN", "zh-TW"]) {
    const dict = readLocale(locale)
    for (const key of required)
      assert.match(
        dict[key],
        /[\u4e00-\u9fff]/,
        `${locale}: ${key} fell back to English`,
      )
  }
})

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const file = path.join(dir, item.name)
    if (item.isDirectory()) return item.name === "lang" ? [] : sourceFiles(file)
    return /\.tsx?$/.test(file) && !file.includes(".test.") ? [file] : []
  })
}

test("static translation calls resolve to actual string keys", () => {
  for (const file of sourceFiles(path.join(root, "src"))) {
    const source = fs.readFileSync(file, "utf8")
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)
    const visit = (node) => {
      if (
        ts.isCallExpression(node) &&
        node.expression.getText(tree) === "t" &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        const key = node.arguments[0].text
        assert.equal(
          typeof english[key],
          "string",
          `${path.relative(root, file)}: unknown translation ${key}`,
        )
      }
      ts.forEachChild(node, visit)
    }
    visit(tree)
  }
})

test("product JSX labels and notifications do not contain hard-coded English prose", () => {
  const identifiers = new Set([
    "OpenList",
    "Cmd",
    "Ctrl",
    "CF Worker",
    "EdgeOne",
    "ESA",
    "Emby",
    "OpenSubsonic",
    "ISBN：",
    ":&nbsp;",
  ])
  const check = (text, file) => {
    if (
      !/[A-Za-z]{3}/.test(text) ||
      /[\u4e00-\u9fff]/.test(text) ||
      identifiers.has(text)
    )
      return
    if (
      /^(?:\/|https?:\/\/|\[\{)/.test(text) ||
      /^[a-z][a-z0-9_]*(?:\.[a-z0-9_-]+)+$/.test(text)
    )
      return
    assert.fail(
      `${path.relative(root, file)}: hard-coded English label ${JSON.stringify(text)}`,
    )
  }
  for (const file of sourceFiles(path.join(root, "src"))) {
    const tree = ts.createSourceFile(
      file,
      fs.readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    )
    const visit = (node) => {
      if (ts.isJsxText(node)) check(node.text.trim(), file)
      if (
        ts.isJsxAttribute(node) &&
        node.initializer &&
        ts.isStringLiteral(node.initializer) &&
        /^(title|placeholder|aria-label|alt|label)$/.test(
          node.name.getText(tree),
        )
      )
        check(node.initializer.text, file)
      if (
        ts.isCallExpression(node) &&
        /^notify\.(error|success|warning|info)$/.test(
          node.expression.getText(tree),
        )
      ) {
        for (const arg of node.arguments)
          if (ts.isStringLiteral(arg)) check(arg.text, file)
      }
      ts.forEachChild(node, visit)
    }
    visit(tree)
  }
})
