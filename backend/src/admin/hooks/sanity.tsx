import { 
  useMutation, 
  UseMutationOptions, 
  useQueryClient, 
  useQuery, 
  UseQueryOptions, 
  QueryKey 
} from "@tanstack/react-query"
import { sdk } from "../lib/sdk"
import { FetchError } from "@medusajs/js-sdk"

// Hook to trigger syncing a single product to Sanity
export const useTriggerSanityProductSync = (
  id: string,
  options?: UseMutationOptions
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/sanity/documents/${id}/sync`, {
        method: "post",
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: [`sanity_document`, `sanity_document_${id}`],
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

// Hook to fetch a Sanity document for a product
export const useSanityDocument = (
  id: string,
  query?: Record<any, any>,
  options?: Omit<
    UseQueryOptions<
      Record<any, any>,
      FetchError,
      { sanity_document: Record<any, any>; studio_url: string },
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const fetchSanityProductStatus = async (query?: Record<any, any>) => {
    return await sdk.client.fetch<Record<any, any>>(
      `/admin/sanity/documents/${id}`,
      {
        query,
      }
    )
  }
  const { data, ...rest } = useQuery({
    queryFn: async () => fetchSanityProductStatus(query),
    queryKey: [`sanity_document_${id}`],
    ...options,
  })
  return { ...data, ...rest }
}

// Hook to trigger syncing all products to Sanity
export const useTriggerSanitySync = (options?: UseMutationOptions) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/sanity/syncs`, {
        method: "post",
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: [`sanity_sync`],
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

// Hook to fetch all Sanity sync executions
export const useSanitySyncs = (
  query?: Record<any, any>,
  options?: Omit<
    UseQueryOptions<
      Record<any, any>,
      FetchError,
      { workflow_executions: Record<any, any>[] },
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const fetchSanitySyncs = async (query?: Record<any, any>) => {
    return await sdk.client.fetch<Record<any, any>>(`/admin/sanity/syncs`, {
      query,
    })
  }
  const { data, ...rest } = useQuery({
    queryFn: async () => fetchSanitySyncs(query),
    queryKey: [`sanity_sync`],
    ...options,
  })
  return { ...data, ...rest }
}