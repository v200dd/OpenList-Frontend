import { useCopyLink } from "~/hooks"
import { CenterIcon } from "./Icon"

export const CopyLink = () => {
  const { copySelectedShortLink } = useCopyLink()
  return (
    <CenterIcon
      name="copy_link"
      onClick={() => {
        void copySelectedShortLink()
      }}
    />
  )
}
