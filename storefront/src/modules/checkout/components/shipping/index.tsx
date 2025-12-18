"use client"

import { RadioGroup } from "@headlessui/react"
import { CheckCircleSolid } from "@medusajs/icons"
import { Button, Heading, Text, clx } from "@medusajs/ui"

import Divider from "@modules/common/components/divider"
import Radio from "@modules/common/components/radio"
import ErrorMessage from "@modules/checkout/components/error-message"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { setShippingMethod } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

const getDisplayName = (originalName: string) => {
  const nameMap: Record<string, string> = {
    'shipstation': 'UPS Ground',
  }

  const lowerName = originalName.toLowerCase()
  
  for (const [key, displayName] of Object.entries(nameMap)) {
    if (lowerName.includes(key)) {
      return displayName
    }
  }
  
  return originalName
}

const getDeliveryTime = (originalName: string) => {
  const timeMap: Record<string, string> = {
    'shipstation': '2-3 days',
  }

  const lowerName = originalName.toLowerCase()
  
  for (const [key, deliveryTime] of Object.entries(timeMap)) {
    if (lowerName.includes(key)) {
      return deliveryTime
    }
  }
  
  return '2-3 days'
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | undefined>(undefined)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "delivery"

  const selectedShippingMethod = availableShippingMethods?.find(
    (method) => method.id === cart.shipping_methods?.at(-1)?.shipping_option_id
  )

  // Reset selection when address changes or when opening delivery step
  useEffect(() => {
    if (isOpen) {
      setSelectedOption(selectedShippingMethod?.id)
    }
  }, [isOpen, selectedShippingMethod?.id])

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = () => {
    router.push(pathname + "?step=payment", { scroll: false })
  }

  const handleShippingMethodClick = async (id: string) => {
    // If clicking the already selected option, deselect it
    if (selectedOption === id) {
      setSelectedOption(undefined)
      return
    }

    // Otherwise, select the new option
    setIsLoading(true)
    setSelectedOption(id)
    
    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .catch((err) => {
        setError(err.message)
        setSelectedOption(undefined) // Reset on error
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  // Force refresh cart data when delivery step opens
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 Delivery step opened - refreshing cart data')
      router.refresh()
    }
  }, [isOpen, router])

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && cart.shipping_methods?.length === 0,
            }
          )}
        >
          Delivery
          {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
            <CheckCircleSolid />
          )}
        </Heading>
        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <Text>
              <button
                onClick={handleEdit}
                className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                data-testid="edit-delivery-button"
              >
                Edit
              </button>
            </Text>
          )}
      </div>
      {isOpen ? (
        <div data-testid="delivery-options-container">
          <div className="pb-8">
            <RadioGroup value={selectedOption} onChange={handleShippingMethodClick}>
              {availableShippingMethods?.map((option) => {
                const displayName = getDisplayName(option.name || '')
                const deliveryTime = getDeliveryTime(option.name || '')
                
                const shippingPrice = option.amount || option.calculated_price?.calculated_amount || 0
                
                return (
                  <RadioGroup.Option
                    key={option.id}
                    value={option.id}
                    data-testid="delivery-option-radio"
                    className={clx(
                      "flex items-center justify-between text-small-regular cursor-pointer py-4 border rounded-rounded px-8 mb-2 hover:shadow-borders-interactive-with-active",
                      {
                        "border-ui-border-interactive":
                          option.id === selectedOption,
                      }
                    )}
                  >
                    <div className="flex items-center gap-x-4">
                      <Radio
                        checked={option.id === selectedOption}
                      />
                      <span className="text-base-regular">{displayName}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      {shippingPrice > 0 && (
                        <span className="text-ui-fg-base font-medium">
                          {convertToLocale({
                            amount: shippingPrice,
                            currency_code: cart.currency_code,
                          })}
                        </span>
                      )}
                      <span className="text-ui-fg-subtle text-small-regular">
                        {deliveryTime}
                      </span>
                    </div>
                  </RadioGroup.Option>
                )
              })}
            </RadioGroup>
          </div>

          <ErrorMessage
            error={error}
            data-testid="delivery-option-error-message"
          />

          <Button
            size="large"
            className="mt-6"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!selectedOption}
            data-testid="submit-delivery-option-button"
          >
            Continue to payment
          </Button>
        </div>
      ) : (
        <div>
          <div className="text-small-regular">
            {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Method
                </Text>
                <Text className="txt-medium text-ui-fg-subtle">
                  {getDisplayName(selectedShippingMethod?.name || '')} ({getDeliveryTime(selectedShippingMethod?.name || '')})
                </Text>
              </div>
            )}
          </div>
        </div>
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Shipping
