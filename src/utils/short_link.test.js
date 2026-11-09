import test from "node:test"
import assert from "node:assert/strict"
import { requestShortLink } from "./short_link.ts"

const messages = {
  failed: "短链接生成失败",
  network: "短链接服务连接失败",
  invalid: "短链接服务返回的链接无效",
}
test("missing short-link configuration does not disable ordinary downloads", async () => {
  assert.equal(
    await requestShortLink(
      "https://example.test/file.ipa",
      " ",
      messages,
      () => {
        throw new Error("should not fetch")
      },
    ),
    "https://example.test/file.ipa",
  )
})
test("valid short links preserve the API request contract", async () => {
  const link = await requestShortLink(
    "https://example.test/file",
    "https://short.test/api",
    messages,
    async (url, options) => {
      assert.equal(url, "https://short.test/api")
      assert.deepEqual(JSON.parse(options.body), {
        url: "https://example.test/file",
      })
      return new Response('{"link":"https://short.test/abc"}')
    },
  )
  assert.equal(link, "https://short.test/abc")
})
test("network, HTTP, malformed JSON and invalid URL errors remain localized", async () => {
  const cases = [
    [() => Promise.reject(new Error("Failed to fetch")), messages.network],
    [async () => new Response("bad", { status: 503 }), messages.failed],
    [async () => new Response("not JSON"), messages.invalid],
    [async () => new Response('{"link":null}'), messages.invalid],
    [
      async () => new Response('{"link":"javascript:alert(1)"}'),
      messages.invalid,
    ],
  ]
  for (const [fetcher, expected] of cases) {
    await assert.rejects(
      requestShortLink(
        "https://example.test/file",
        "https://short.test/api",
        messages,
        fetcher,
      ),
      (error) =>
        error.message.includes(expected) && !/[A-Za-z]{3}/.test(error.message),
    )
  }
})
