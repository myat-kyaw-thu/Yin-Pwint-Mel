"use client"

import { Editor } from "@/components/blocks/editor-00/editor"
import { SerializedEditorState } from "lexical"

interface RichEditorProps {
  value: any
  onChange: (value: any) => void
  placeholder?: string
}

export function RichEditor({ value, onChange }: RichEditorProps) {
  const handleChange = (serializedState: SerializedEditorState) => {
    onChange(serializedState)
  }

  // Parse value if it's a string
  let initialState: SerializedEditorState | undefined
  if (value) {
    try {
      initialState = typeof value === "string" ? JSON.parse(value) : value
    } catch (e) {
      initialState = undefined
    }
  }

  return (
    <Editor
      editorSerializedState={initialState}
      onSerializedChange={handleChange}
    />
  )
}
