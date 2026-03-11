'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QrCode, Download, Upload, Trash2, ScanLine, Users } from 'lucide-react'
import QRCodeStyling from 'qr-code-styling'

interface QrCodeDashboardProps {
  subdomain: string | null
  canAccess: boolean
  qrScanCount: { total: number; unique: number } | null
}

const DOT_STYLES = [
  { value: 'rounded', label: 'Rounded' },
  { value: 'dots', label: 'Dots' },
  { value: 'classy', label: 'Classy' },
  { value: 'classy-rounded', label: 'Classy Rounded' },
  { value: 'square', label: 'Square' },
  { value: 'extra-rounded', label: 'Extra Rounded' },
] as const

type DotType = (typeof DOT_STYLES)[number]['value']

export function QrCodeDashboard({ subdomain, canAccess, qrScanCount }: QrCodeDashboardProps) {
  const qrRef = useRef<HTMLDivElement>(null)
  const qrInstance = useRef<QRCodeStyling | null>(null)
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [dotColor, setDotColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [dotType, setDotType] = useState<DotType>('rounded')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const qrUrl = subdomain ? `${appUrl}/qr/${encodeURIComponent(subdomain)}` : ''

  const createQr = useCallback(() => {
    if (!qrUrl) return null
    return new QRCodeStyling({
      width: 300,
      height: 300,
      data: qrUrl,
      image: logoDataUrl ?? undefined,
      dotsOptions: {
        color: dotColor,
        type: dotType,
      },
      backgroundOptions: {
        color: bgColor,
      },
      cornersSquareOptions: {
        type: 'extra-rounded',
      },
      cornersDotOptions: {
        type: 'dot',
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 8,
        imageSize: 0.4,
      },
      qrOptions: {
        errorCorrectionLevel: 'H',
      },
    })
  }, [qrUrl, logoDataUrl, dotColor, bgColor, dotType])

  useEffect(() => {
    if (!qrRef.current || !qrUrl) return

    const qr = createQr()
    if (!qr) return

    qrRef.current.innerHTML = ''
    qr.append(qrRef.current)
    qrInstance.current = qr
  }, [qrUrl, createQr])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = () => {
      setLogoDataUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoDataUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDownload = async (format: 'png' | 'svg') => {
    const qr = createQr()
    if (!qr) return

    // Create a temporary larger QR for high-quality export
    const exportQr = new QRCodeStyling({
      width: 1024,
      height: 1024,
      data: qrUrl,
      image: logoDataUrl ?? undefined,
      dotsOptions: {
        color: dotColor,
        type: dotType,
      },
      backgroundOptions: {
        color: bgColor,
      },
      cornersSquareOptions: {
        type: 'extra-rounded',
      },
      cornersDotOptions: {
        type: 'dot',
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 24,
        imageSize: 0.4,
      },
      qrOptions: {
        errorCorrectionLevel: 'H',
      },
    })

    const slug = subdomain ?? 'qr-code'
    await exportQr.download({
      name: `${slug}-qr-code`,
      extension: format,
    })
  }

  if (!canAccess) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <QrCode className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm font-medium text-gray-900">QR Code Generator</p>
        <p className="mt-1 text-xs text-gray-500">
          Upgrade to Full Access to generate QR codes with scan tracking.
        </p>
      </div>
    )
  }

  if (!subdomain) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <QrCode className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm font-medium text-gray-900">QR Code Generator</p>
        <p className="mt-1 text-xs text-gray-500">
          Set up your website subdomain in Settings first to generate a QR code.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Scan Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total QR Scans</CardTitle>
            <ScanLine className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{qrScanCount?.total?.toLocaleString() ?? '0'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Unique Scanners</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{qrScanCount?.unique?.toLocaleString() ?? '0'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* QR Code Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">QR Code Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div
              ref={qrRef}
              className="flex items-center justify-center rounded-lg border bg-white p-4"
              style={{ minHeight: 308, minWidth: 308 }}
            />
            <p className="break-all text-center text-xs text-gray-500">Points to: {qrUrl}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleDownload('png')}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                PNG
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownload('svg')}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                SVG
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Customization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Customize</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Center Logo</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  {logoDataUrl ? 'Change Logo' : 'Upload Logo'}
                </Button>
                {logoDataUrl && (
                  <Button variant="ghost" size="sm" onClick={handleRemoveLogo}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              {logoDataUrl && (
                <img
                  src={logoDataUrl}
                  alt="QR logo"
                  className="h-12 w-12 rounded border object-contain"
                />
              )}
            </div>

            {/* Dot Style */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Dot Style</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {DOT_STYLES.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setDotType(style.value)}
                    className={`rounded-md border px-2 py-1.5 text-xs transition-colors ${
                      dotType === style.value
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Dot Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={dotColor}
                    onChange={(e) => setDotColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border"
                  />
                  <Input
                    value={dotColor}
                    onChange={(e) => setDotColor(e.target.value)}
                    className="h-8 text-xs"
                    maxLength={7}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Background</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border"
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-8 text-xs"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
