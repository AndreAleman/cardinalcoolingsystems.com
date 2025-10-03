import { useRouter } from "next/navigation"

import {
ChangeEvent,
FormEvent,
RefObject,
useEffect,
useRef,
useState,
} from "react"

import { UseSearchBoxProps, useSearchBox } from "react-instantsearch-hooks-web"

export type ControlledSearchBoxProps = React.ComponentProps<"div"> & {
inputRef: RefObject<HTMLInputElement>
onChange(event: ChangeEvent<HTMLInputElement>): void
onReset(event: FormEvent): void
onSubmit?(event: FormEvent): void
placeholder?: string
value: string
}

type SearchBoxProps = {
children: (state: {
value: string
inputRef: RefObject<HTMLInputElement>
onChange: (event: ChangeEvent<HTMLInputElement>) => void
onReset: () => void
placeholder: string
}) => React.ReactNode
placeholder?: string
} & UseSearchBoxProps

const SearchBoxWrapper = ({
children,
placeholder = "Search products...",
...rest
}: SearchBoxProps) => {
const { query, refine } = useSearchBox(rest)
const [value, setValue] = useState(query)
const inputRef = useRef<HTMLInputElement>(null)
const router = useRouter()

const onReset = () => {
setValue("")
}

const onChange = (event: ChangeEvent<HTMLInputElement>) => {
const newValue = event.currentTarget.value
console.log('🔍 Search input changed:', newValue) // DEBUG
setValue(newValue)
}

// This effect should trigger search as you type
useEffect(() => {
console.log('🔄 useEffect triggered - query:', query, 'value:', value) // DEBUG
if (query !== value) {
  console.log('🚀 Calling refine with:', value) // DEBUG
  refine(value)
}
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [value])

// Sync with external query changes
useEffect(() => {
console.log('📥 Query changed externally:', query) // DEBUG
setValue(query)
}, [query])

return (
<>
  {children({
    value,
    inputRef,
    onChange,
    onReset,
    placeholder,
  })}
</>
)
}

export default SearchBoxWrapper
