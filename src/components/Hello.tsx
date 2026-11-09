import { useT } from "~/hooks"

const Hello = () => {
  const t = useT()
  return <h1>{t("global.greeting")}</h1>
}
export default Hello
