"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { cache } from "react"
import { getAuthHeaders, removeAuthToken, setAuthToken } from "./cookies"
import { acceptInvite, createCompany } from "./companies"

export const getCustomer = cache(async function () {
  return await sdk.store.customer
    .retrieve({}, { next: { tags: ["customer"] }, ...getAuthHeaders() })
    .then(({ customer }) => customer)
    .catch(() => null)
})

export const updateCustomer = cache(async function (
  body: HttpTypes.StoreUpdateCustomer
) {
  const updateRes = await sdk.store.customer
    .update(body, {}, getAuthHeaders())
    .then(({ customer }) => customer)
    .catch(medusaError)

  revalidateTag("customer")
  return updateRes
})

export async function signup(_currentState: unknown, formData: FormData) {
  const password = formData.get("password") as string
  const companyName = ((formData.get("company_name") as string) || "").trim()
  const customerForm = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: formData.get("phone") as string,
  }

  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password: password,
    })

    const customHeaders = { authorization: `Bearer ${token}` }
    
    const { customer: createdCustomer } = await sdk.store.customer.create(
      customerForm,
      {},
      customHeaders
    )

    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email: customerForm.email,
      password,
    })

    setAuthToken(typeof loginToken === 'string' ? loginToken : loginToken.location)

    revalidateTag("customer")
  } catch (error: any) {
    return error.toString()
  }

  // A company name means "give me a Dashboard": create the Pending
  // Company now so the Welcome Code shows the moment they land.
  if (companyName) {
    try {
      await createCompany(companyName)
    } catch (error: any) {
      return `Your account was created, but the company could not be: ${error.toString()}`
    }
  }
  return null
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    await sdk.auth
      .login("customer", "emailpass", { email, password })
      .then((token) => {
        setAuthToken(typeof token === 'string' ? token : token.location)
        revalidateTag("customer")
      })
  } catch (error: any) {
    return error.toString()
  }
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()
  removeAuthToken()
  revalidateTag("auth")
  revalidateTag("customer")
  redirect(`/${countryCode}/account`)
}

export const addCustomerAddress = async (
  _currentState: unknown,
  formData: FormData
): Promise<any> => {
  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
  }

  return sdk.store.customer
    .createAddress(address, {}, getAuthHeaders())
    .then(({ customer }) => {
      revalidateTag("customer")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  await sdk.store.customer
    .deleteAddress(addressId, getAuthHeaders())
    .then(() => {
      revalidateTag("customer")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId = currentState.addressId as string

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, getAuthHeaders())
    .then(() => {
      revalidateTag("customer")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

/*
  Sign in, or create the account first if it does not exist yet.
  Used by invite acceptance: the email is fixed to the invite's.
*/
async function signInOrRegister(input: {
  email: string
  password: string
  first_name?: string
  last_name?: string
}) {
  try {
    const token = await sdk.auth.login("customer", "emailpass", {
      email: input.email,
      password: input.password,
    })
    setAuthToken(typeof token === "string" ? token : token.location)
    revalidateTag("customer")
    return
  } catch {
    /* no account yet, or wrong password — try to create */
  }
  const regToken = await sdk.auth.register("customer", "emailpass", {
    email: input.email,
    password: input.password,
  })
  await sdk.store.customer.create(
    { email: input.email, first_name: input.first_name, last_name: input.last_name },
    {},
    { authorization: `Bearer ${regToken}` }
  )
  const token = await sdk.auth.login("customer", "emailpass", {
    email: input.email,
    password: input.password,
  })
  setAuthToken(typeof token === "string" ? token : token.location)
  revalidateTag("customer")
}

/*
  Invite accept page. Not signed in: sign in with the invite's email
  (creating the account if it is new), then join. Signed in: just join.
*/
export async function acceptInviteSignup(_state: unknown, formData: FormData) {
  const token = formData.get("token") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!("authorization" in getAuthHeaders())) {
    try {
      await signInOrRegister({
        email,
        password,
        first_name: formData.get("first_name") as string,
        last_name: formData.get("last_name") as string,
      })
    } catch (error: any) {
      return "Could not sign you in. If you already have an account with this email, use its password."
    }
  }

  try {
    await acceptInvite(token)
  } catch (error: any) {
    return error.toString()
  }
  redirect("/account")
}
