"use client"

import { Table, Text, clx } from "@medusajs/ui"

import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState, useEffect, useRef } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
}

const Item = ({ item, type = "full" }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localQuantity, setLocalQuantity] = useState(item.quantity) // Local state for immediate UI updates
  const debounceRef = useRef<NodeJS.Timeout>()

  const { handle } = item.variant?.product ?? {}

  // Update local quantity when item quantity changes (from external updates)
  useEffect(() => {
    setLocalQuantity(item.quantity)
  }, [item.quantity])

  const debouncedUpdateQuantity = async (quantity: number) => {
    if (quantity === item.quantity) return // No change needed
    
    setError(null)
    setUpdating(true)

    try {
      await updateLineItem({
        lineId: item.id,
        quantity,
      })
    } catch (err: any) {
      setError(err.message)
      // Revert local quantity on error
      setLocalQuantity(item.quantity)
    } finally {
      setUpdating(false)
    }
  }

  const changeQuantity = (newQuantity: number) => {
    // Update UI immediately
    setLocalQuantity(newQuantity)
    
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    // Set new timeout for API call
    debounceRef.current = setTimeout(() => {
      debouncedUpdateQuantity(newQuantity)
    }, 500) // Wait 500ms after user stops clicking
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Improved max quantity logic
  const getMaxQuantity = () => {
    if (item.variant?.manage_inventory && item.variant?.inventory_quantity) {
      return Math.min(item.variant.inventory_quantity, 99)
    }
    return 99
  }

  const maxQuantity = getMaxQuantity()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (value >= 1 && value <= maxQuantity) {
      changeQuantity(value)
    }
  }

  const incrementQuantity = () => {
    if (localQuantity < maxQuantity) {
      changeQuantity(localQuantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (localQuantity > 1) {
      changeQuantity(localQuantity - 1)
    }
  }

  return (
    <Table.Row className="w-full" data-testid="product-row">
      <Table.Cell className="!pl-0 p-4 w-24">
        <LocalizedClientLink
          href={`/products/${handle}`}
          className={clx("flex", {
            "w-16": type === "preview",
            "small:w-24 w-12": type === "full",
          })}
        >
          <Thumbnail
            thumbnail={item.variant?.product?.thumbnail}
            images={item.variant?.product?.images}
            size="square"
          />
        </LocalizedClientLink>
      </Table.Cell>

      <Table.Cell className="text-left">
        <Text
          className="txt-medium-plus text-ui-fg-base"
          data-testid="product-title"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
      </Table.Cell>

      {type === "full" && (
        <Table.Cell>
          <div className="flex gap-2 items-center">
            <DeleteButton id={item.id} data-testid="product-delete-button" />
            
            {/* Debounced Number Input with +/- Buttons */}
            <div className="flex items-center border border-ui-border-base rounded-md">
              <button
                onClick={decrementQuantity}
                disabled={localQuantity <= 1 || updating}
                className="w-8 h-8 flex items-center justify-center text-ui-fg-base hover:bg-ui-bg-subtle disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-md"
                aria-label="Decrease quantity"
                type="button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              
              <input
                type="number"
                min="1"
                max={maxQuantity}
                value={localQuantity}
                onChange={handleInputChange}
                disabled={updating}
                className="w-16 h-8 text-center border-0 border-x border-ui-border-base focus:outline-none focus:ring-0 text-sm font-medium text-ui-fg-base bg-transparent disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                data-testid="product-quantity-input"
              />
              
              <button
                onClick={incrementQuantity}
                disabled={localQuantity >= maxQuantity || updating}
                className="w-8 h-8 flex items-center justify-center text-ui-fg-base hover:bg-ui-bg-subtle disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-r-md"
                aria-label="Increase quantity"
                type="button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            
            {updating && (
              <div className="flex items-center gap-1">
                <Spinner className="w-4 h-4" />
                <Text className="text-xs text-ui-fg-muted">Updating...</Text>
              </div>
            )}
          </div>
          
          {/* Show max quantity hint if limited */}
          {maxQuantity < 99 && (
            <Text className="text-xs text-ui-fg-muted mt-1">
              Max: {maxQuantity}
            </Text>
          )}
          
          <ErrorMessage error={error} data-testid="product-error-message" />
        </Table.Cell>
      )}

      {type === "full" && (
        <Table.Cell className="hidden small:table-cell">
          <LineItemUnitPrice item={item} style="tight" />
        </Table.Cell>
      )}

      <Table.Cell className="!pr-0">
        <span
          className={clx("!pr-0", {
            "flex flex-col items-end h-full justify-center": type === "preview",
          })}
        >
          {type === "preview" && (
            <span className="flex gap-x-1 ">
              <Text className="text-ui-fg-muted">{localQuantity}x </Text>
              <LineItemUnitPrice item={item} style="tight" />
            </span>
          )}
          <LineItemPrice item={item} style="tight" />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item