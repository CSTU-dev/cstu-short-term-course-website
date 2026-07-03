"use client";

import { Copy, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ReferralLinkTools({
  link,
  label,
}: {
  link: string;
  label: string;
}) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  async function downloadQr() {
    try {
      const dataUrl = await QRCode.toDataURL(link, { width: 512, margin: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${label}-qr.png`;
      a.click();
    } catch {
      toast.error("Could not generate QR code");
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={copy}>
        <Copy className="size-3.5" /> Copy
      </Button>
      <Button variant="outline" size="sm" onClick={downloadQr}>
        <QrCode className="size-3.5" /> QR
      </Button>
    </div>
  );
}
