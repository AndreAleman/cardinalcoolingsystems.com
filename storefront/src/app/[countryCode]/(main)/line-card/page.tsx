// app/us/line-card/page.tsx
export default function LineCardPage() {
  return (
    <div className="w-full h-screen">
      <iframe 
        src="/line-card.pdf" 
        className="w-full h-full border-0"
        title="Line Card"
      />
    </div>
  )
}
