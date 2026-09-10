import { MaybeLoading } from "~/components"
import { recordKeysToLowerCase } from "~/utils"
import { FileInfo } from "./info"
import { useFetchText, useParseText, useT, useUtil } from "~/hooks"
import { Button } from "@hope-ui/solid"
import { parse } from "ini"
import { createMemo, Show } from "solid-js"
import { isFileDownloadEnabled } from "~/store"

export default function () {
  const [content] = useFetchText()
  const { copy } = useUtil()
  const t = useT()
  const url = createMemo(() => {
    if (content.loading) return ""
    const ini = content()?.content
    if (!ini) throw new Error("No content")
    if (typeof ini === "string") throw new Error(ini)
    const { text } = useParseText(ini)
    const config = recordKeysToLowerCase(parse(text() || ""))
    const shortcutUrl = config.internetshortcut?.url
    if (!shortcutUrl) throw new Error("Invalid .url file: no URL found")
    return shortcutUrl
  })
  return (
    <MaybeLoading loading={content.loading}>
      <FileInfo>
        <Show when={isFileDownloadEnabled()}>
          <Button colorScheme="accent" onClick={() => copy(url())}>
            {t("home.toolbar.copy_link")}
          </Button>
        </Show>
        <Button as="a" href={url()} target="_blank" rel="noopener noreferrer">
          {t("home.preview.open_in_new_window")}
        </Button>
      </FileInfo>
    </MaybeLoading>
  )
}
