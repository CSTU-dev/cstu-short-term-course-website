"use client";

import { Copy, Download, QrCode } from "lucide-react";
import QRCodeLib from "qrcode";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * Full referral share widget: the link with a copy button, plus an inline QR
 * code that can be copied to the clipboard or downloaded. Used by the course
 * detail page's referral section. (The compact table variant lives in
 * `referral-link-tools.tsx`.)
 */
export function ReferralShare({
  link,
  label,
}: {
  link: string;
  label: string;
}) {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCodeLib.toDataURL(link, { width: 512, margin: 2 })
      .then((url) => {
        if (!cancelled) setQr(url);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not generate QR code");
      });
    return () => {
      cancelled = true;
    };
  }, [link]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  async function copyQr() {
    if (!qr) return;
    try {
      const blob = await (await fetch(qr)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      toast.success("QR code copied");
    } catch {
      toast.error("Copying images isn't supported in this browser");
    }
  }

  function downloadQr() {
    if (!qr) return;
    const a = document.createElement("a");
    a.href = qr;
    a.download = `${label}-referral-qr.png`;
    a.click();
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border p-5">
      <div>
        <p className="text-muted-foreground text-sm font-medium">
          Your referral link
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            readOnly
            value={link}
            aria-label="Referral link"
            onFocus={(e) => e.currentTarget.select()}
            className="bg-muted min-w-0 flex-1 truncate rounded-md px-3 py-2 font-mono text-xs"
          />
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="size-3.5" /> Copy
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element -- data-URL QR, no optimization needed
          <img
            src={qr}
            alt="Referral QR code"
            className="size-28 rounded-md border bg-white p-1"
          />
        ) : (
          <div className="bg-muted size-28 animate-pulse rounded-md" />
        )}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyQr}
            disabled={!qr}
          >
            <QrCode className="size-3.5" /> Copy QR
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadQr}
            disabled={!qr}
          >
            <Download className="size-3.5" /> Download
          </Button>
        </div>
      </div>
    </div>
  );
}
