'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Copy, Download, Link as LinkIcon } from 'lucide-react';
import { useState, useRef } from 'react';

import { ResetPinButton } from './reset-pin-button';

interface AccessCardProps {
  eventId: string;
  title: string;
  slug: string | null | undefined;
  pin?: string;
  baseUrl: string;
  type: 'host' | 'guest';
}

export function AccessCard({ eventId, title, slug, pin, baseUrl, type }: AccessCardProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);

  if (!slug) return null; // Wait for backfill or additive fields

  const baseLink = `${baseUrl}/${type}/${slug}`;
  const link = pin ? `${baseLink}?pin=${pin}` : baseLink;

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyPin = () => {
    if (!pin) return;
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const downloadQR = () => {
    if (!qrRef.current) return;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${title.replace(/\s+/g, '_')}_QR.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 border border-gray-200 rounded-xl bg-white shadow-sm">
      <div className="flex flex-col gap-4 flex-1">
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>
        
        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Link</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-600 truncate">
                {link}
              </div>
              <button 
                onClick={copyLink}
                className="shrink-0 flex items-center justify-center p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
                title="Copy Link"
              >
                <LinkIcon size={16} className={copiedLink ? "text-green-600" : ""} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">PIN</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-sm font-mono text-gray-900 tracking-widest">
                {pin ? pin : "•••••• (Hidden)"}
              </div>
              {pin && (
                <button 
                  onClick={copyPin}
                  className="shrink-0 flex items-center justify-center p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
                  title="Copy PIN"
                >
                  <Copy size={16} className={copiedPin ? "text-green-600" : ""} />
                </button>
              )}
            </div>
            {!pin && (
              <div className="flex items-center mt-1">
                <p className="text-xs text-gray-400">PIN is only shown once upon creation or reset.</p>
                <ResetPinButton eventId={eventId} target={type} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-center gap-3 border-l border-gray-100 pl-6">
        <div className="bg-white p-2 border border-gray-200 rounded-xl shadow-sm">
          <QRCodeSVG 
            value={link} 
            size={120} 
            level="M" 
            includeMargin={false} 
            ref={qrRef} 
          />
        </div>
        <button 
          onClick={downloadQR}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Download size={16} />
          Download QR
        </button>
      </div>
    </div>
  );
}
