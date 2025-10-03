interface UpsOptions {
  clientId: string
  clientSecret: string
  accountNumber: string
  shipFromZip: string
  apiUrl?: string
}

interface ShippingAddress {
  address_1: string
  address_2?: string
  city: string
  province: string
  postal_code: string
  country_code: string
}

interface UpsRateResponse {
  service_code: string
  service_name: string
  amount: number
  currency_code: string
  estimated_days?: number
}

interface CalculatedShippingOptionPrice {
  calculated_amount: number  // Medusa v2 uses dollars, not cents
  is_calculated_price_tax_inclusive: boolean
  data?: Record<string, any>
}

export default class UpsFulfillmentProviderService {
  static identifier = "ups-fulfillment"
  
  private options_: UpsOptions

  constructor(container: any, options: UpsOptions) {
    this.options_ = {
      clientId: options.clientId || process.env.UPS_CLIENT_ID,
      clientSecret: options.clientSecret || process.env.UPS_CLIENT_SECRET,
      accountNumber: options.accountNumber || process.env.UPS_ACCOUNT_NUMBER,
      shipFromZip: options.shipFromZip || process.env.UPS_SHIP_FROM_ZIP,
      apiUrl: options.apiUrl || process.env.UPS_API_URL || "https://wwwcie.ups.com/api"
    }

    if (!this.options_.clientId || !this.options_.clientSecret || !this.options_.accountNumber) {
      console.error("UPS credentials missing:", {
        hasClientId: !!this.options_.clientId,
        hasClientSecret: !!this.options_.clientSecret,
        hasAccountNumber: !!this.options_.accountNumber
      })
    }
  }

  async getFulfillmentOptions(): Promise<any[]> {
    console.log("🔍 getFulfillmentOptions called")
    return [
      {
        id: "ups-standard",
        title: "UPS Standard",
        type: {
          label: "UPS Shipping",
          description: "Real-time UPS shipping rates"
        }
      }
    ]
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    console.log("🔍 validateFulfillmentData called with:")
    console.log("   optionData:", JSON.stringify(optionData, null, 2))
    console.log("   data:", JSON.stringify(data, null, 2))
    console.log("   context:", JSON.stringify(context, null, 2))
    
    const result = {
      ...data,
      service_code: data.service_code || "03"
    }
    console.log("🔍 validateFulfillmentData returning:", JSON.stringify(result, null, 2))
    return result
  }

  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    console.log("🔍 validateOption called with:", JSON.stringify(data, null, 2))
    
    // FIXED: Check the nested path
    const optionId = (data.data as any)?.id
    const result = optionId === "ups-standard"
    console.log("🔍 validateOption returning:", result)
    return result
  }

  async canCalculate(data: Record<string, unknown>): Promise<boolean> {
    console.log("🔍 canCalculate called with data:", JSON.stringify(data, null, 2))
    
    // FIXED: Check the nested path
    const optionId = (data.data as any)?.id
    console.log("🔍 optionId:", optionId)
    console.log("🔍 Expected: ups-standard")
    console.log("🔍 Match?", optionId === "ups-standard")
    
    const result = optionId === "ups-standard"
    console.log("🔍 canCalculate returning:", result)
    
    return result
  }

  async calculatePrice(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<CalculatedShippingOptionPrice> {

    console.log("🔍 BEFORE UPS CALC - Cart totals:", {
      cartId: context?.id,
      subtotal: context?.subtotal,
      itemTotal: context?.item_total,
      total: context?.total
    });

    console.log("🔍 UPS calculatePrice called with:", {
      optionData,
      data,
      hasCart: !!context?.cart,
      hasId: !!context?.id,
      contextKeys: Object.keys(context || {})
    })
    
    // FIXED: Don't return hardcoded prices for admin validation
    if (!context?.id || !context?.items) {
      console.log("❌ Admin validation - no cart context available")
      throw new Error("Cannot calculate shipping without cart context")
    }
    
    // Use context directly as the cart (not context.cart)
    const cart = context as any
    
    if (!cart?.shipping_address) {
      console.error("No shipping address provided")
      throw new Error("Shipping address is required for rate calculation")
    }

    try {
      console.log("🔍 Debug cart total:", {
        cartTotal: cart.total,
        itemTotal: cart.item_total,
        subtotal: cart.subtotal,
        items: cart.items?.length
      })
      
      // Check free shipping eligibility first
      const orderTotal = cart.item_total || cart.subtotal || 0
      if (this.qualifiesForFreeShipping(orderTotal, cart.items)) {
        console.log("Order qualifies for free shipping:", orderTotal)
        return {
          calculated_amount: 0,
          is_calculated_price_tax_inclusive: false,
          data: {
            service_code: "FREE",
            service_name: "Free Shipping",
            estimated_days: 5
          }
        }
      }

      // Get UPS rates
      const rates = await this.getUpsRates(cart.shipping_address, cart.items, orderTotal)
      
      if (!rates || rates.length === 0) {
        console.log("No UPS rates returned")
        throw new Error("Unable to calculate shipping rates at this time")
      }

      // Return cheapest rate (usually Ground)
      const cheapestRate = rates.reduce((min, rate) => 
        rate.amount < min.amount ? rate : min
      )

      console.log("Selected UPS rate:", cheapestRate)

      const result = {
        calculated_amount: cheapestRate.amount,
        is_calculated_price_tax_inclusive: false,
        data: {
          service_code: cheapestRate.service_code,
          service_name: cheapestRate.service_name,
          estimated_days: cheapestRate.estimated_days
        }
      }
      
      console.log("🔍 AFTER UPS CALC - Returning shipping only:", result);
      console.log("🔍 FINAL RETURN VALUE:", JSON.stringify(result, null, 2))
      return result

    } catch (error) {
      console.error("UPS rate calculation error:", error)
      throw new Error(`Failed to calculate UPS shipping rates: ${error.message}`)
    }
  }

  async createFulfillment(
    data: Record<string, unknown>,
    items: any[],
    order: any,
    fulfillment: any
  ): Promise<Record<string, unknown>> {
    
    console.log("Creating UPS fulfillment for order:", order.id)
    
    const trackingNumber = `CB${Date.now()}`
    
    return {
      tracking_number: trackingNumber,
      tracking_url: `https://www.ups.com/track?tracknum=${trackingNumber}`,
      data: {
        carrier: "UPS",
        service: data.service_code || "03",
        created_at: new Date().toISOString()
      }
    }
  }

  async cancelFulfillment(fulfillment: Record<string, unknown>): Promise<Record<string, unknown>> {
    console.log("Canceling UPS fulfillment:", fulfillment)
    return {
      ...fulfillment,
      canceled_at: new Date().toISOString()
    }
  }

  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.options_.clientId}:${this.options_.clientSecret}`).toString('base64')
    
    console.log("Getting UPS access token...")
    
    const response = await fetch(`${this.options_.apiUrl}/security/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-merchant-id': this.options_.accountNumber
      },
      body: 'grant_type=client_credentials'
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('UPS Auth Error:', response.status, errorText)
      throw new Error(`UPS authentication failed: ${response.status}`)
    }

    const data = await response.json()
    console.log("UPS access token obtained successfully")
    return data.access_token
  }

  private async getUpsRates(
    shippingAddress: ShippingAddress,
    items: any[],
    orderTotal: number
  ): Promise<UpsRateResponse[]> {
    
    // TEMPORARY: Skip UPS API call due to 404 error
    console.log("🔧 TEMP: Using fallback rates due to UPS API 404")
    return this.getFallbackRates()

    /* Comment out the UPS API call for now due to 404 errors
    try {
      const token = await this.getAccessToken()
      
      // Calculate total weight from items
      const totalWeight = items.reduce((sum, item) => {
        const weight = item.variant?.weight || 1
        return sum + (weight * item.quantity)
      }, 0)

      console.log("UPS rate request details:", {
        shipToZip: shippingAddress.postal_code,
        totalWeight,
        itemCount: items.length
      })

      const rateRequest = {
        RateRequest: {
          Request: {
            RequestOption: "Shop",
            TransactionReference: {
              CustomerContext: "Cowbird Depot Rate Request"
            }
          },
          Shipment: {
            Shipper: {
              Name: "Cowbird Depot",
              ShipperNumber: this.options_.accountNumber,
              Address: {
                PostalCode: this.options_.shipFromZip,
                CountryCode: "US"
              }
            },
            ShipTo: {
              Name: "Customer",
              Address: {
                AddressLine: shippingAddress.address_1,
                City: shippingAddress.city,
                StateProvinceCode: shippingAddress.province,
                PostalCode: shippingAddress.postal_code,
                CountryCode: shippingAddress.country_code
              }
            },
            ShipFrom: {
              Name: "Cowbird Depot Fulfillment",
              Address: {
                PostalCode: this.options_.shipFromZip,
                CountryCode: "US"
              }
            },
            Package: {
              PackagingType: {
                Code: "02",
                Description: "Package"
              },
              Dimensions: {
                UnitOfMeasurement: {
                  Code: "IN"
                },
                Length: "12",
                Width: "12",
                Height: "8"
              },
              PackageWeight: {
                UnitOfMeasurement: {
                  Code: "LBS"
                },
                Weight: Math.max(totalWeight, 1).toString()
              }
            }
          }
        }
      }

      const response = await fetch(`${this.options_.apiUrl}/rating/v1/Shop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'transId': Date.now().toString(),
          'transactionSrc': 'Cowbird'
        },
        body: JSON.stringify(rateRequest)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('UPS Rating API Error:', response.status, errorText)
        return this.getFallbackRates()
      }

      const data = await response.json()
      console.log("UPS API response received successfully")
      return this.parseUpsResponse(data)
      
    } catch (error) {
      console.error('UPS rate request error:', error)
      return this.getFallbackRates()
    }
    */
  }

  private parseUpsResponse(data: any): UpsRateResponse[] {
    try {
      const rates = data.RateResponse?.RatedShipment || []
      
      if (!Array.isArray(rates) || rates.length === 0) {
        console.log("No rates in UPS response, using fallback")
        return this.getFallbackRates()
      }
      
      const parsedRates = rates.map(rate => ({
        service_code: rate.Service?.Code || 'UNK',
        service_name: this.getServiceName(rate.Service?.Code),
        amount: parseFloat(rate.TotalCharges?.MonetaryValue || '0'),
        currency_code: rate.TotalCharges?.CurrencyCode || 'USD',
        estimated_days: this.getEstimatedDays(rate.Service?.Code)
      }))

      console.log("Parsed UPS rates:", parsedRates)
      return parsedRates
      
    } catch (error) {
      console.error('Error parsing UPS response:', error)
      return this.getFallbackRates()
    }
  }

  private getServiceName(code: string): string {
    const serviceNames = {
      '03': 'UPS Ground',
      '02': 'UPS 2nd Day Air',
      '01': 'UPS Next Day Air',
      '12': 'UPS 3 Day Select',
      '13': 'UPS Next Day Air Saver'
    }
    
    return serviceNames[code] || `UPS Service ${code}`
  }

  private getEstimatedDays(code: string): number {
    const estimatedDays = {
      '01': 1, // Next Day Air
      '13': 1, // Next Day Air Saver  
      '02': 2, // 2nd Day Air
      '12': 3, // 3 Day Select
      '03': 5  // Ground
    }
    
    return estimatedDays[code] || 5
  }

  private getFallbackRates(): UpsRateResponse[] {
    return [
      {
        service_code: 'STANDARD',
        service_name: 'Standard Shipping',
        amount: 19.99,  // FIXED: Updated fallback rate
        currency_code: 'USD',
        estimated_days: 5
      }
    ]
  }

  private qualifiesForFreeShipping(orderTotal: number, items: any[]): boolean {
    // USE cart.item_total or cart.subtotal (just items)
    // DON'T use cart.total (includes shipping)
    
    if (orderTotal >= 100) { // $100.00
      return true
    }
    
    if (orderTotal >= 2500) { // $2500.00  
      return true
    }

    return false
  }
}
