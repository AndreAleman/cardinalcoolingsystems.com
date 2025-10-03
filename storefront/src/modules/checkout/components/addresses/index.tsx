"use client"

import { CheckCircleSolid } from "@medusajs/icons"
import { Heading, Text, useToggleState } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"

import Divider from "@modules/common/components/divider"
import Spinner from "@modules/common/icons/spinner"

import { setAddresses } from "@lib/data/cart"
import compareAddresses from "@lib/util/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [processingStep, setProcessingStep] = useState<string>("")

  const isOpen = searchParams.get("step") === "address"

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    setProcessingStep("Validating address...")
    
    startTransition(async () => {
      try {
        // Step 1: Validate and save addresses
        setProcessingStep("Saving address information...")
        const result = await setAddresses(null, formData)
        
        if (result?.error) {
          setError(result.error)
          setProcessingStep("")
          return
        }
        
        // Step 2: Calculate shipping
        setProcessingStep("Calculating shipping options...")
        
        // Small delay to show the progress message
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Step 3: Navigate to delivery
        setProcessingStep("Redirecting to delivery options...")
        router.push(pathname + "?step=delivery")
        
      } catch (err: any) {
        setError(err.message || "Failed to save address. Please try again.")
        setProcessingStep("")
      }
    })
  }

  return (
    <div className="bg-white border border-gray-100 rounded-sm">
      {/* Header Section - IBM Carbon inspired */}
      <div className="flex flex-row items-center justify-between px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Heading
            level="h2"
            className="text-lg font-normal text-gray-900 tracking-tight"
          >
            Shipping Address
          </Heading>
          {!isOpen && cart?.shipping_address && (
            <CheckCircleSolid className="w-4 h-4 text-green-600" />
          )}
        </div>
        {!isOpen && cart?.shipping_address && (
          <button
            onClick={handleEdit}
            className="text-sm font-normal text-blue-600 hover:text-blue-700 transition-colors duration-200 border-b border-transparent hover:border-blue-600"
            data-testid="edit-address-button"
          >
            Edit
          </button>
        )}
      </div>

      {/* Content Section */}
      <div className="px-6 py-6">
        {isOpen ? (
          <form action={handleSubmit} className="space-y-8">
            {/* Guest Checkout Notice */}
            {!customer && (
              <div className="bg-blue-50 border border-blue-100 rounded-sm px-4 py-3">
                <Text className="text-sm text-blue-800 font-normal">
                  <span className="font-medium">Checking out as a guest.</span> You'll have the option to create an account after your order.
                </Text>
              </div>
            )}

            {/* Processing Status */}
            {isPending && processingStep && (
              <div className="bg-gray-50 border border-gray-200 rounded-sm px-4 py-3">
                <div className="flex items-center gap-3">
                  <Spinner className="w-4 h-4 text-gray-600" />
                  <Text className="text-sm text-gray-700 font-normal">
                    {processingStep}
                  </Text>
                </div>
              </div>
            )}

            {/* Shipping Address Form */}
            <div className="space-y-6">
              <ShippingAddress
                customer={customer}
                checked={sameAsBilling}
                onChange={toggleSameAsBilling}
                cart={cart}
              />

              {/* Billing Address Section */}
              {!sameAsBilling && (
                <div className="pt-8 border-t border-gray-100">
                  <Heading
                    level="h3"
                    className="text-base font-normal text-gray-900 mb-6 tracking-tight"
                  >
                    Billing Address
                  </Heading>
                  <BillingAddress cart={cart} />
                </div>
              )}

              {/* Submit Button - Enhanced with loading states */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-normal py-3 px-6 rounded-sm transition-colors duration-200 border-0 text-sm tracking-wide flex items-center justify-center gap-2"
                  data-testid="submit-address-button"
                >
                  {isPending ? (
                    <>
                      <Spinner className="w-4 h-4" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    "Continue to Delivery"
                  )}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3">
                  <Text className="text-sm text-red-800 font-normal">
                    {error}
                  </Text>
                </div>
              )}
            </div>
          </form>
        ) : (
          /* Address Summary - Enhanced Mobile Layout */
          <div>
            {cart && cart.shipping_address ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Shipping Address */}
                <div className="space-y-2" data-testid="shipping-address-summary">
                  <Text className="text-sm font-medium text-gray-900 tracking-tight">
                    Shipping Address
                  </Text>
                  <div className="space-y-1">
                    <Text className="text-sm text-gray-600 font-normal">
                      {cart.shipping_address.first_name} {cart.shipping_address.last_name}
                    </Text>
                    <Text className="text-sm text-gray-600 font-normal">
                      {cart.shipping_address.address_1} {cart.shipping_address.address_2}
                    </Text>
                    <Text className="text-sm text-gray-600 font-normal">
                      {cart.shipping_address.postal_code}, {cart.shipping_address.city}
                    </Text>
                    <Text className="text-sm text-gray-600 font-normal">
                      {cart.shipping_address.country_code?.toUpperCase()}
                    </Text>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-2" data-testid="shipping-contact-summary">
                  <Text className="text-sm font-medium text-gray-900 tracking-tight">
                    Contact Information
                  </Text>
                  <div className="space-y-1">
                    <Text className="text-sm text-gray-600 font-normal">
                      {cart.shipping_address.phone}
                    </Text>
                    <Text className="text-sm text-gray-600 font-normal">
                      {cart.email}
                    </Text>
                  </div>
                </div>

                {/* Billing Address */}
                <div className="space-y-2" data-testid="billing-address-summary">
                  <Text className="text-sm font-medium text-gray-900 tracking-tight">
                    Billing Address
                  </Text>
                  <div className="space-y-1">
                    {sameAsBilling ? (
                      <Text className="text-sm text-gray-600 font-normal">
                        Same as shipping address
                      </Text>
                    ) : (
                      <>
                        <Text className="text-sm text-gray-600 font-normal">
                          {cart.billing_address?.first_name} {cart.billing_address?.last_name}
                        </Text>
                        <Text className="text-sm text-gray-600 font-normal">
                          {cart.billing_address?.address_1} {cart.billing_address?.address_2}
                        </Text>
                        <Text className="text-sm text-gray-600 font-normal">
                          {cart.billing_address?.postal_code}, {cart.billing_address?.city}
                        </Text>
                        <Text className="text-sm text-gray-600 font-normal">
                          {cart.billing_address?.country_code?.toUpperCase()}
                        </Text>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Spinner className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Elegant Divider */}
      <div className="border-b border-gray-100"></div>
    </div>
  )
}

export default Addresses