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
import { createSignal } from "solid-js"
import { BsQrCode } from "solid-icons/bs"
import QRCode from "qrcode"
import { useT, useUtil, useLink } from "~/hooks"
import { objStore } from "~/store"
import { api, baseName, notify, safeBtoa } from "~/utils"
import { FileInfo } from "./info"

const shortLinkAPI = "https://url.200996.xyz/create"

const Ipa = () => {
  const t = useT()
  const [installing, setInstalling] = createSignal(false)
  const [trInstalling, setTrInstalling] = createSignal(false)
  const { copy } = useUtil()
  const { currentObjLink } = useLink()
  const [qrUrl, setQrUrl] = createSignal("")
  const [qrOpen, setQrOpen] = createSignal(false)
  const [shortLink, setShortLink] = createSignal("")
  const [shortLinkOpen, setShortLinkOpen] = createSignal(false)
  const sourceLink = () => currentObjLink(true)

  const createShortLink = async () => {
    const response = await fetch(shortLinkAPI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: sourceLink() }),
    })
    const body = await response.json()
    if (!response.ok || !body.link) {
      throw new Error(body.message || "Failed to create short link")
    }
    return body.link as string
  }

  const copyShortLink = async () => {
    try {
      const link = await createShortLink()
      setShortLink(link)
      setShortLinkOpen(true)
      await copy(link)
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Failed to create short link")
    }
  }

  const toggleQRCode = async () => {
    if (qrOpen()) {
      setQrOpen(false)
      return
    }
    try {
      const shortLink = await createShortLink()
      setQrUrl(
        await QRCode.toDataURL(shortLink, {
          type: "image/jpeg",
          scale: 2,
        }),
      )
      setQrOpen(true)
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Failed to create short link")
    }
  }

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
        <Button as="a" href={objStore.raw_url} target="_blank">
          {t("home.preview.download")}
        </Button>
        <ButtonGroup colorScheme="accent" attached>
          <Button onClick={copyShortLink}>
            {t("home.toolbar.copy_link")}
          </Button>
          <Popover opened={qrOpen()} motionPreset="none">
            <PopoverTrigger
              as={IconButton}
              icon={<BsQrCode />}
              aria-label="QRCode"
              onClick={toggleQRCode}
            />
            <PopoverContent width="fit-content">
              <PopoverArrow />
              <PopoverBody>
                <Image
                  maxWidth="300px"
                  src={qrUrl()}
                  alt="QR Code of download link"
                  objectFit="cover"
                />
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </ButtonGroup>
      </HStack>
      <Modal opened={shortLinkOpen()} onClose={() => setShortLinkOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>{t("home.toolbar.copy_link")}</ModalHeader>
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
