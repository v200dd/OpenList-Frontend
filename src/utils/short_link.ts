export interface ShortLinkMessages {
  failed: string
  network: string
  invalid: string
}

/** Shared by IPA previews and folder link copying; empty configuration uses the original link. */
export async function requestShortLink(
  url: string,
  endpoint: string,
  messages: ShortLinkMessages,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  if (!endpoint.trim()) return url
  let response: Response
  try {
    response = await fetcher(endpoint.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
  } catch {
    throw new Error(messages.network)
  }
  if (!response.ok) throw new Error(`${messages.failed}（${response.status}）`)
  let body: { link?: unknown }
  try {
    body = await response.json()
  } catch {
    throw new Error(messages.invalid)
  }
  if (!body || typeof body.link !== "string" || !body.link.trim()) {
    throw new Error(messages.invalid)
  }
  let link: URL
  try {
    link = new URL(body.link.trim())
  } catch {
    throw new Error(messages.invalid)
  }
  if (!["http:", "https:"].includes(link.protocol))
    throw new Error(messages.invalid)
  return body.link.trim()
}
