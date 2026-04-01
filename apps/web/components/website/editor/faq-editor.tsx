'use client'

import type { FaqContent } from '@planfortwo/types'
import { Plus, Trash2 } from 'lucide-react'

interface FaqEditorProps {
  content: FaqContent
  onChange: (content: FaqContent) => void
}

export function FaqEditor({ content, onChange }: FaqEditorProps) {
  const questions = content.questions ?? []

  const updateQuestion = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = questions.map((q, i) =>
      i === index
        ? {
            question: field === 'question' ? value : q.question,
            answer: field === 'answer' ? value : q.answer,
          }
        : q,
    )
    onChange({ ...content, questions: updated })
  }

  const addQuestion = () => {
    onChange({
      ...content,
      questions: [...questions, { question: '', answer: '' }],
    })
  }

  const removeQuestion = (index: number) => {
    onChange({
      ...content,
      questions: questions.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-foreground">Questions & Answers</label>

      {questions.map((item, i) => (
        <div
          key={i}
          className={`space-y-3 rounded-lg border border-border p-4 ${i > 0 ? '' : ''}`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="mt-1 text-xs font-medium text-muted-foreground">Q{i + 1}</span>
            <button
              type="button"
              onClick={() => removeQuestion(i)}
              className="text-sm text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Question</label>
            <input
              type="text"
              value={item.question}
              onChange={(e) => updateQuestion(i, 'question', e.target.value)}
              placeholder="e.g., What is the dress code?"
              className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Answer</label>
            <textarea
              value={item.answer}
              onChange={(e) => updateQuestion(i, 'answer', e.target.value)}
              placeholder="Your answer..."
              rows={3}
              className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        <Plus className="h-4 w-4" />
        Add Question
      </button>
    </div>
  )
}
