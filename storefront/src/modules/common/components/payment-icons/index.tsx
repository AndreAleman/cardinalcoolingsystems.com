import { clx } from "@medusajs/ui"

// The card brands accepted at checkout. The footer, product pages, cart and
// checkout all render this one list so they never drift apart (GMC requires
// the same payment methods to be shown everywhere they appear).
export const PAYMENT_METHODS = [
  { src: "/images/payments/visa.svg", alt: "Visa" },
  { src: "/images/payments/mastercard.svg", alt: "Mastercard" },
  { src: "/images/payments/amex.svg", alt: "American Express" },
  { src: "/images/payments/discover.svg", alt: "Discover" },
] as const

type PaymentIconsProps = {
  className?: string
  iconClassName?: string
  "data-testid"?: string
}

export default function PaymentIcons({
  className,
  iconClassName = "h-7 w-auto",
  "data-testid": dataTestId = "payment-icons",
}: PaymentIconsProps) {
  return (
    <div
      className={clx("flex items-center gap-3", className)}
      data-testid={dataTestId}
    >
      {PAYMENT_METHODS.map((method) => (
        <img
          key={method.alt}
          src={method.src}
          alt={method.alt}
          width={36}
          height={28}
          loading="lazy"
          decoding="async"
          className={iconClassName}
        />
      ))}
    </div>
  )
}
