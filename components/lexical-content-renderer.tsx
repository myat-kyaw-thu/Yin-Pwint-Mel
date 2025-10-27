"use client"

import { useEffect, useState } from "react"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { editorTheme } from "@/components/editor/themes/editor-theme"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { ListNode, ListItemNode } from "@lexical/list"
import { SerializedEditorState } from "lexical"

const nodes = [HeadingNode, QuoteNode, ListNode, ListItemNode]

interface LexicalContentRendererProps {
    content: any
}

function LoadContentPlugin({ content }: { content: SerializedEditorState }) {
    const [editor] = useLexicalComposerContext()

    useEffect(() => {
        if (content) {
            try {
                const editorState = editor.parseEditorState(content)
                editor.setEditorState(editorState)
            } catch (e) {
                console.error("Failed to parse content:", e)
            }
        }
    }, [content, editor])

    return null
}

export function LexicalContentRenderer({ content }: LexicalContentRendererProps) {
    const [parsedContent, setParsedContent] = useState<SerializedEditorState | null>(null)

    useEffect(() => {
        if (content) {
            try {
                const parsed = typeof content === "string" ? JSON.parse(content) : content
                setParsedContent(parsed)
            } catch (e) {
                console.error("Failed to parse content:", e)
            }
        }
    }, [content])

    if (!parsedContent) {
        return <div className="text-muted-foreground">No content available</div>
    }

    const initialConfig = {
        namespace: "ContentRenderer",
        theme: editorTheme,
        nodes,
        editable: false,
        onError: (error: Error) => {
            console.error(error)
        },
    }

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
                <RichTextPlugin
                    contentEditable={
                        <ContentEditable className="outline-none min-h-[200px] leading-relaxed" />
                    }
                    placeholder={<div />}
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <LoadContentPlugin content={parsedContent} />
            </div>
        </LexicalComposer>
    )
}
