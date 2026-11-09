import {
  Button,
  ButtonGroup,
  HStack,
  IconButton,
  Image,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
} from "@hope-ui/solid"
import { useCopyLink, useLink, useT } from "~/hooks"
import { isFileDownloadEnabled, objStore } from "~/store"
import { FileInfo } from "./info"
import { OpenWith } from "../file/open-with"
import { createEffect, createSignal, onCleanup, Show } from "solid-js"
import { BsQrCode } from "solid-icons/bs"
import QRCode from "qrcode"
import { notify } from "~/utils"

export const Download = (props: { openWith?: boolean }) => {
  const t = useT()
  const { copyCurrentRawLink } = useCopyLink()
  const { currentObjLink } = useLink()
  const [qrUrl, setQrUrl] = createSignal("")
  createEffect(() => {
    const link = currentObjLink()
    if (!isFileDownloadEnabled()) {
      setQrUrl("")
      return
    }
    let active = true
    onCleanup(() => {
      active = false
    })
    QRCode.toDataURL(link, { type: "image/jpeg", scale: 2 })
      .then((url) => {
        if (active) setQrUrl(url)
      })
      .catch(() => {
        if (active) notify.error(t("home.preview.qr_failed"))
      })
  })
  const [pinned, setPinned] = createSignal(false)
  const [hover, setHover] = createSignal(false)
  return (
    <FileInfo>
      <Show when={isFileDownloadEnabled()}>
        <HStack spacing="$2">
          <ButtonGroup colorScheme="accent" attached>
            <Button onClick={() => copyCurrentRawLink(true)}>
              {t("home.toolbar.copy_link")}
            </Button>
            <Popover opened={pinned() || hover()} motionPreset="none">
              <PopoverTrigger
                as={IconButton}
                icon={<BsQrCode />}
                aria-label={t("global.qr_code")}
                onClick={() => {
                  setPinned(!pinned())
                }}
                onMouseOver={() => setHover(true)}
                onMouseOut={() => setHover(false)}
              />
              <PopoverContent width="fit-content">
                <PopoverArrow />
                <PopoverBody>
                  <Image
                    maxWidth="300px"
                    src={qrUrl()}
                    alt={t("global.download_qr_code")}
                    objectFit="cover"
                  />
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </ButtonGroup>
          <Button as="a" href={objStore.raw_url} target="_blank">
            {t("home.preview.download")}
          </Button>
        </HStack>
      </Show>
      <Show when={props.openWith}>
        <OpenWith />
      </Show>
    </FileInfo>
  )
}

export default Download
