import Link from "next/link"

export default function Logo() {
  return (
    <Link 
      href="/" 
      className="flex items-center hover:opacity-80 transition-opacity duration-200 py-3 pr-6"
    >
      <img
        src="/images/logo/new-cardinal-cooling-logo.svg"
        alt="Cowbird Depot Logo"
        className="max-h-24 w-auto lg:max-h-24"   // Constrain to container height
      />
    </Link>
  )
}
