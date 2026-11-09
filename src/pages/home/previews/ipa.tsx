import {
  Button,
  ButtonGroup,
  HStack,
  IconButton,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
} from "@hope-ui/solid"
import { createEffect, createSignal, Show } from "solid-js"
import { BsQrCode } from "solid-icons/bs"
import QRCode from "qrcode"
import { useT, useLink } from "~/hooks"
import { getSetting, isFileDownloadEnabled, objStore } from "~/store"
import { api, baseName, notify, safeBtoa } from "~/utils"
import { FileInfo } from "./info"
import { requestShortLink } from "~/utils/short_link"

const Ipa = () => {
  const t = useT()
  const [installing, setInstalling] = createSignal(false)
  const [trInstalling, setTrInstalling] = createSignal(false)
  const { currentObjLink } = useLink()
  const [qrUrl, setQrUrl] = createSignal("")
  const [qrOpen, setQrOpen] = createSignal(false)
  const [shortLink, setShortLink] = createSignal("")
  const [shortLinkOpen, setShortLinkOpen] = createSignal(false)
  const sourceLink = () => currentObjLink(true)

  const createShortLink = async (url = sourceLink()) => {
    return requestShortLink(url, getSetting("short_link_api"), {
      failed: t("home.preview.short_link_failed"),
      network: t("home.preview.short_link_network"),
      invalid: t("home.preview.short_link_invalid"),
    })
  }

  const getShortLink = async () => {
    if (shortLink()) return shortLink()
    const link = await createShortLink()
    setShortLink(link)
    return link
  }

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      return true
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = value
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      try {
        document.body.appendChild(textarea)
        textarea.select()
        return document.execCommand("copy")
      } catch {
        return false
      } finally {
        textarea.remove()
      }
    }
  }

  const copyShortLink = async () => {
    try {
      const link = await getShortLink()
      if (await copyToClipboard(link)) {
        notify.success(t("global.copied"))
        return
      }
      setShortLinkOpen(true)
    } catch (error) {
      notify.error(
        error instanceof Error
          ? error.message
          : t("home.preview.short_link_failed"),
      )
    }
  }

  const toggleQRCode = async () => {
    if (qrOpen()) {
      setQrOpen(false)
      return
    }
    try {
      const shortLink = await getShortLink()
      setQrUrl(
        await QRCode.toDataURL(shortLink, {
          type: "image/jpeg",
          scale: 2,
        }),
      )
      setQrOpen(true)
    } catch (error) {
      notify.error(t("home.preview.qr_failed"))
    }
  }

  createEffect(() => {
    if (!isFileDownloadEnabled()) return
    const url = sourceLink()
    setShortLink("")
    setQrOpen(false)
    void createShortLink(url)
      .then((link) => {
        if (sourceLink() === url) setShortLink(link)
      })
      .catch(() => undefined)
  })

  return (
    <FileInfo>
      <HStack spacing="$2">
        <Button
          as="a"
          href={
            "itms-services://?action=download-manifest&url=" +
            `${api}/i/${safeBtoa(
              encodeURIComponent(objStore.raw_url) +
                "/" +
                baseName(encodeURIComponent(objStore.obj.name)),
            )}.plist`
          }
          onClick={() => {
            setInstalling(true)
          }}
        >
          {t(`home.preview.${installing() ? "installing" : "install"}`)}
        </Button>
        <Button
          as="a"
          colorScheme="primary"
          href={
            "apple-magnifier://install?url=" +
            encodeURIComponent(currentObjLink(true))
          }
          onClick={() => {
            setTrInstalling(true)
          }}
        >
          {t(`home.preview.${trInstalling() ? "tr-installing" : "tr-install"}`)}
        </Button>
        <Show when={isFileDownloadEnabled()}>
          <Button as="a" href={shortLink() || sourceLink()} target="_blank">
            {t("home.preview.download")}
          </Button>
          <ButtonGroup colorScheme="accent" attached>
            <Button onClick={copyShortLink}>
              {t(
                getSetting("short_link_api").trim()
                  ? "home.toolbar.copy_short_link"
                  : "home.toolbar.copy_link",
              )}
            </Button>
            <Popover opened={qrOpen()} motionPreset="none">
              <PopoverTrigger
                as={IconButton}
                icon={<BsQrCode />}
                aria-label={t("global.qr_code")}
                onClick={toggleQRCode}
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
        </Show>
      </HStack>
      <Modal
        opened={isFileDownloadEnabled() && shortLinkOpen()}
        onClose={() => setShortLinkOpen(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>{t("home.preview.copy_link_manually")}</ModalHeader>
          <ModalBody pb="$6">
            <Input
              value={shortLink()}
              readOnly
              onFocus={(event) => event.currentTarget.select()}
              onClick={(event) => event.currentTarget.select()}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </FileInfo>
  )
}

export default Ipa
