import type { Tag } from "@/lib/actions/tag.actions"

interface TagBadgeProps {
  tag: Tag
  size?: "sm" | "md"
}

export function TagBadge({ tag, size = "sm" }: TagBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
  }

  return (
    <span
      className={`inline-flex items-center border border-border bg-background text-foreground ${sizeClasses[size]}`}
    >
      {tag.name}
    </span>
  )
}
