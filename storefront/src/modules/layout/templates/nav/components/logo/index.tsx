import Image from "next/image"
import Link from "next/link"

export default function Logo() {
  return (
    <Link
      href="/us"
      className="flex items-center hover:opacity-80 transition-opacity duration-200 py-3 pr-6"
    >
      <Image
        src="/images/logo/new-cardinal-cooling-logo.svg"
        alt="Cardinal Cooling Systems"
        width={180}
        height={96}
        priority
        className="max-h-24 w-auto lg:max-h-24"
      />
    </Link>
  )
}
