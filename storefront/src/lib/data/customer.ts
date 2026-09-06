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

/*
  "Request an account": every new account is a membership request.
  Phone and company name are required — the Pending Company is created
  right after the customer, so Cardinal can accept or reject it and the
  buyer lands on the waiting screen with their Welcome Code.
*/
export async function signup(_currentState: unknown, formData: FormData) {
  const password = formData.get("password") as string
  const companyName = ((formData.get("company_name") as string) || "").trim()
  const phone = ((formData.get("phone") as string) || "").trim()
  const customerForm = {
    email: ((formData.get("email") as string) || "").trim(),
    first_name: ((formData.get("first_name") as string) || "").trim(),
    last_name: ((formData.get("last_name") as string) || "").trim(),
    phone,
  }

  // Validate everything BEFORE creating anything, so a bad field never
  // leaves a half-made account behind.
  if (
    !customerForm.email ||
    !customerForm.first_name ||
    !customerForm.last_name ||
    !password
  ) {
    return "Please fill in your name, email, and password."
  }
  if (phone.length < 7) {
    return "Please enter a phone number with at least 7 digits."
  }
  if (!companyName) {
    return "Please enter your company name."
  }

  // If this browser is already signed in (e.g. a retry after the
  // company step failed), skip straight to the membership request —
  // never re-register.
  const existingCustomer = await getCustomer()

  if (!existingCustomer) {
    try {
      const token = await sdk.auth.register("customer", "emailpass", {
        email: customerForm.email,
        password: password,
      })

      const customHeaders = { authorization: `Bearer ${token}` }

      await sdk.store.customer.create(customerForm, {}, customHeaders)

      const loginToken = await sdk.auth.login("customer", "emailpass", {
        email: customerForm.email,
        password,
      })

      setAuthToken(typeof loginToken === 'string' ? loginToken : loginToken.location)

      revalidateTag("customer")
    } catch (error: any) {
      return error.toString()
    }
  }

  // The membership request itself: the Pending Company. If this fails
  // the customer stays signed in and can retry from the account page's
  // "Request portal access" card — they are never silently left as a
  // bare retail account without being told.
  try {
    await createCompany({ name: companyName, phone })
  } catch (error: any) {
    return `Your sign-in was created, but your membership request did not go through: ${error.toString()} You are signed in — use the "Request portal access" form on your account page to try again.`
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

/*
  Forgot password, step 1: ask the backend to email a reset link.
  The backend answers 201 whether or not the email has an account, and
  this action mirrors that: it NEVER reveals account existence — even a
  backend failure returns the same neutral confirmation.
*/
export async function requestPasswordReset(
  _currentState: unknown,
  formData: FormData
): Promise<{ success: boolean; error: string | null }> {
  const email = ((formData.get("email") as string) || "").trim()

  if (!email) {
    return { success: false, error: "Please enter your email address." }
  }

  try {
    await sdk.auth.resetPassword("customer", "emailpass", {
      identifier: email,
    })
  } catch {
    // Deliberately swallowed: the confirmation must read the same
    // whether or not the email exists.
  }

  return { success: true, error: null }
}

/*
  Forgot password, step 2: set the new password using the token from
  the emailed link. The token rides as the Bearer auth override on
  POST /auth/customer/emailpass/update.
*/
export async function resetPassword(
  _currentState: unknown,
  formData: FormData
): Promise<{ success: boolean; error: string | null }> {
  const token = (formData.get("token") as string) || ""
  const email = ((formData.get("email") as string) || "").trim()
  const password = (formData.get("password") as string) || ""
  const confirmPassword = (formData.get("confirm_password") as string) || ""

  if (!token || !email) {
    return {
      success: false,
      error:
        "This reset link is incomplete. Please use the link from your email, or request a new one.",
    }
  }
  if (password.length < 8) {
    return {
      success: false,
      error: "Please choose a password of at least 8 characters.",
    }
  }
  if (password !== confirmPassword) {
    return { success: false, error: "The passwords do not match." }
  }

  try {
    await sdk.auth.updateProvider(
      "customer",
      "emailpass",
      { email, password },
      token
    )
  } catch {
    return {
      success: false,
      error:
        "This reset link has expired or was already used. Please request a new one.",
    }
  }

  return { success: true, error: null }
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
