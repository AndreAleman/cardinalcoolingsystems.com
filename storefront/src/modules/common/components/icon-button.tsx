interface Props {
  label: string
  icon: "plus" | "chevron-left" | "chevron-right"
  onClick?: () => void
  className?: string
}

export default function IconButton({ label, icon, onClick, className = "" }: Props) {
  const base = "w-12 h-12 flex items-center justify-center rounded-md"
  const theme =
    icon === "plus"
      ? "bg-[--brand-green] text-white hover:opacity-90"
      : "border border-gray-300 text-gray-900 hover:bg-gray-50"

  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={`${base} ${theme} ${className}`}
    >
      {/* swap svg by icon prop */}
    </button>
  )
}
