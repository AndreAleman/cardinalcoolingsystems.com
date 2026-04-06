import { Dialog, Transition } from "@headlessui/react"
import React, { Fragment, useMemo } from "react"

import useToggleState from "@lib/hooks/use-toggle-state"
import { clx } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

type MobileActionsProps = {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  options: Record<string, string | undefined>
  updateOptions: (title: string, value: string) => void
  inStock?: boolean
  handleAddToCart: () => void
  isAdding?: boolean
  show: boolean
  optionsDisabled: boolean
}

const MobileActions: React.FC<MobileActionsProps> = ({
  product,
  variant,
  options,
  updateOptions,
  inStock,
  handleAddToCart,
  isAdding,
  show,
  optionsDisabled,
}) => {
  const { state, open, close } = useToggleState()

  const price = getProductPrice({ product, variantId: variant?.id })

  const selectedPrice = useMemo(() => {
    if (!price) return null
    const { variantPrice, cheapestPrice } = price
    return variantPrice || cheapestPrice || null
  }, [price])

  return (
    <>
      {/* Sticky bottom bar */}
      <div className={clx("lg:hidden inset-x-0 bottom-0 fixed z-50", { "pointer-events-none": !show })}>
        <Transition
          as={Fragment}
          show={show}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0 translate-y-2"
          enterTo="opacity-100 translate-y-0"
          leave="ease-in duration-300"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-2"
        >
          <div
            className="bg-white flex flex-col gap-y-3 p-4 border-t border-gray-100"
            data-testid="mobile-actions"
            style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.08)" }}
          >
            {/* Product + price summary */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate max-w-[60%]" style={{ color: "#111111" }} data-testid="mobile-title">
                {product.title}
              </span>
              {selectedPrice && (
                <div className="flex items-center gap-x-2 text-sm">
                  {selectedPrice.price_type === "sale" && (
                    <span className="line-through text-xs" style={{ color: "#9ca3af" }}>
                      {selectedPrice.original_price}
                    </span>
                  )}
                  <span className="font-semibold" style={{ color: "#111111" }}>
                    {selectedPrice.calculated_price}
                  </span>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={open}
                className="h-11 flex items-center justify-between px-3 text-sm font-medium border border-gray-200 bg-white transition-colors hover:border-gray-400"
                style={{ borderRadius: "5px", color: "#111111" }}
                data-testid="mobile-actions-button"
              >
                <span className="truncate">
                  {variant ? Object.values(options).filter(Boolean).join(" / ") : "Select Options"}
                </span>
                <svg className="w-4 h-4 flex-shrink-0 ml-1" style={{ color: "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <button
                onClick={handleAddToCart}
                disabled={!inStock || !variant || isAdding}
                className="h-11 flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
                data-testid="mobile-cart-button"
              >
                {isAdding ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : !variant ? (
                  "Select variant"
                ) : !inStock ? (
                  "Out of stock"
                ) : (
                  "Add to cart"
                )}
              </button>
            </div>
          </div>
        </Transition>
      </div>

      {/* Options modal */}
      <Transition appear show={state} as={Fragment}>
        <Dialog as="div" className="relative z-[75]" onClose={close}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed bottom-0 inset-x-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel
                className="w-full bg-white overflow-hidden"
                style={{ borderRadius: "10px 10px 0 0" }}
                data-testid="mobile-actions-modal"
              >
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <p className="text-base font-medium" style={{ color: "#111111" }}>Select Options</p>
                  <button
                    onClick={close}
                    className="p-1 transition-colors hover:text-gray-900"
                    style={{ color: "#9ca3af" }}
                    data-testid="close-modal-button"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Options */}
                <div className="px-6 py-6">
                  {(product.variants?.length ?? 0) > 1 && (
                    <div className="flex flex-col gap-y-5">
                      {(product.options || []).map((option) => {
                        const optionValues = option.values || []
                        const currentValue = options[option.title ?? ""]
                        return (
                          <div key={option.id}>
                            <label className="block text-xs font-medium mb-2" style={{ color: "#6b7280" }}>
                              {option.title}
                            </label>
                            <div className="relative">
                              <select
                                value={currentValue || ""}
                                onChange={(e) => updateOptions(option.title ?? "", e.target.value)}
                                disabled={optionsDisabled}
                                className="w-full px-3 py-3 pr-9 text-sm border border-gray-200 bg-white focus:outline-none focus:border-gray-400 disabled:opacity-50 appearance-none"
                                style={{ borderRadius: "5px", color: currentValue ? "#111111" : "#9ca3af" }}
                              >
                                <option value="" disabled>Select {option.title}</option>
                                {optionValues.map((ov) => (
                                  <option key={ov.id} value={ov.value}>{ov.value}</option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                <svg className="w-4 h-4" style={{ color: "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Confirm button */}
                  <button
                    onClick={close}
                    className="mt-6 w-full h-12 text-sm font-semibold text-white transition-all duration-200"
                    style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
                  >
                    Confirm Selection
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default MobileActions
