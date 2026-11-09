import { Box } from "@hope-ui/solid"
import {
  createEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js"
import { MaybeLoading } from "./FullLoading"
import { Error as ErrorView } from "./Base"
import loader from "@monaco-editor/loader"
import { useCDN, useT } from "~/hooks"
import type * as monacoType from "monaco-editor"
import { local } from "~/store"
import { currentLang } from "~/app/i18n"
import { loadScriptIIFE } from "~/utils/load_external"

export interface MonacoEditorProps {
  value: string
  onChange?: (value: string) => void
  path?: string
  language?: string
  options?: monacoType.editor.IStandaloneEditorConstructionOptions
  onEditorReady?: (editor: monacoType.editor.IStandaloneCodeEditor) => void
}
export let monaco: typeof monacoType

const supportedEditorLanguages = new Set([
  "cs",
  "de",
  "es",
  "fr",
  "it",
  "ja",
  "ko",
  "pl",
  "pt-br",
  "ru",
  "tr",
  "zh-cn",
  "zh-tw",
])

export const MonacoEditorLoader = (props: MonacoEditorProps) => {
  const t = useT()
  const { monacoPath } = useCDN()
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal("")
  const locale = currentLang().toLowerCase()
  const editorLocale = supportedEditorLanguages.has(locale)
    ? locale
    : supportedEditorLanguages.has(locale.split("-")[0])
      ? locale.split("-")[0]
      : "en"
  loader.config({
    paths: {
      vs: monacoPath(),
    },
    // Monaco 0.57 locale files set globals rather than defining an AMD module.
    // Preload them as scripts; asking AMD to require them stalls initialization.
    "vs/nls": { availableLanguages: { "*": "en" } },
  })
  Promise.resolve()
    .then(async () => {
      if (editorLocale !== "en") {
        await loadScriptIIFE(
          `${monacoPath()}/nls/lang/${editorLocale}.js`,
          `monaco-nls-${editorLocale}`,
        )
      }
      return loader.init()
    })
    .then((m) => {
      monaco = m
      setLoading(false)
    })
    .catch(() => {
      setError(t("home.preview.editor_load_failed"))
      setLoading(false)
    })
  return (
    <Show when={!error()} fallback={<ErrorView msg={error()} />}>
      <MaybeLoading loading={loading()}>
        <MonacoEditor {...props} />
      </MaybeLoading>
    </Show>
  )
}

export const MonacoEditor = (props: MonacoEditorProps) => {
  let monacoEditorDiv: HTMLDivElement
  let monacoEditor: monacoType.editor.IStandaloneCodeEditor
  let model: monacoType.editor.ITextModel

  onMount(() => {
    const constructionOptions = {
      ...props.options,
      value: props.value,
      fontSize: parseInt(local.editor_font_size),
      automaticLayout: true,
    }
    monacoEditor = monaco.editor.create(monacoEditorDiv!, constructionOptions)
    model = monaco.editor.createModel(
      props.value,
      props.language,
      props.path ? monaco.Uri.parse(props.path) : undefined,
    )
    monacoEditor.setModel(model)
    monacoEditor.onDidChangeModelContent(() => {
      props.onChange?.(monacoEditor.getValue())
    })
    props.onEditorReady?.(monacoEditor)
  })
  createEffect(
    on(
      () => props.value,
      (value) => {
        monacoEditor.setValue(value)
      },
      { defer: true },
    ),
  )

  createEffect(() => {
    monaco.editor.setTheme(props.options?.theme ?? "vs")
  })

  createEffect(
    on(
      () => props.language,
      (lang) => {
        if (lang && model) {
          monaco.editor.setModelLanguage(model, lang)
        }
      },
      { defer: true },
    ),
  )

  createEffect(() => {
    monacoEditor?.updateOptions({
      fontSize: parseInt(local.editor_font_size),
      ...props.options,
    })
  })

  onCleanup(() => {
    model && model.dispose()
    monacoEditor && monacoEditor.dispose()
  })
  return <Box w="$full" flex={1} minH="60vh" ref={monacoEditorDiv!} />
}
