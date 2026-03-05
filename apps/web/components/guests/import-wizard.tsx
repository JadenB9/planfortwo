'use client'

import { useState, useRef } from 'react'
import type { CsvImportResult } from '@planfortwo/types'

interface ImportWizardProps {
  onImport: (file: File) => Promise<CsvImportResult>
  onClose: () => void
}

type Step = 'upload' | 'preview' | 'results'

export function ImportWizard({ onImport, onClose }: ImportWizardProps) {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<string[][]>([])
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<CsvImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!selected.name.endsWith('.csv')) {
      setError('Please select a CSV file.')
      return
    }
    setFile(selected)
    setError(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split('\n').filter((l) => l.trim())
      const rows = lines.slice(0, 6).map((line) => line.split(',').map((c) => c.trim()))
      setPreviewRows(rows)
      setStep('preview')
    }
    reader.readAsText(selected)
  }

  async function handleImport() {
    if (!file) return
    setImporting(true)
    setError(null)
    try {
      const result = await onImport(file)
      setResults(result)
      setStep('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {step === 'upload' && (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mt-3 text-sm text-gray-600">Upload a CSV file with guest information.</p>
          <p className="mt-1 text-xs text-gray-500">
            Expected columns: firstName, lastName, email, phone, side, isVip, isChild, hasPlusOne,
            plusOneName
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="bg-wedding-600 hover:bg-wedding-700 mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
          >
            Select CSV File
          </button>
        </div>
      )}

      {step === 'preview' && previewRows.length > 0 && (
        <div>
          <h3 className="font-serif text-lg font-semibold text-gray-900">Preview</h3>
          <p className="mt-1 text-sm text-gray-500">
            Showing first {Math.min(previewRows.length - 1, 5)} rows from {file?.name}
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {previewRows[0]?.map((header, i) => (
                    <th key={i} className="px-3 py-2 font-semibold text-gray-700">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {previewRows.slice(1).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-gray-600">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => {
                setStep('upload')
                setFile(null)
                setPreviewRows([])
              }}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="bg-wedding-600 hover:bg-wedding-700 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
            >
              {importing ? 'Importing...' : 'Import Guests'}
            </button>
          </div>
        </div>
      )}

      {step === 'results' && results && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="font-serif text-lg font-semibold text-gray-900">Import Complete</h3>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-green-50 p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{results.imported}</p>
              <p className="text-xs text-green-600">Imported</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{results.skipped}</p>
              <p className="text-xs text-amber-600">Skipped</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3 text-center">
              <p className="text-2xl font-bold text-red-700">{results.errors.length}</p>
              <p className="text-xs text-red-600">Errors</p>
            </div>
          </div>
          {results.errors.length > 0 && (
            <div className="mt-4 max-h-40 overflow-y-auto rounded-xl bg-red-50 p-3">
              <ul className="space-y-1 text-xs text-red-700">
                {results.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={onClose}
            className="bg-wedding-600 hover:bg-wedding-700 mt-4 w-full rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
