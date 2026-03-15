'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { gooeyToast } from 'goey-toast'
import type { ResolvedSong } from '../api/resolve/route'
import SongInput from './SongInput'
import ResultCard from './ResultCard'
import SkeletonCard from './SkeletonCard'

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: ResolvedSong }

export default function MusicResolver() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [inputValue, setInputValue] = useState('')
  const [state, setState] = useState<State>({ status: 'idle' })
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const resolve = useCallback(async (url: string) => {
    if (!url.trim()) return

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState({ status: 'loading' })

    try {
      const res = await fetch(`/api/resolve?url=${encodeURIComponent(url.trim())}`, {
        signal: controller.signal,
      })
      const json = await res.json()

      if (!res.ok) {
        setState({ status: 'idle' })
        gooeyToast.error(json.error ?? 'Something went wrong.')
        return
      }

      setState({ status: 'success', data: json })
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setState({ status: 'idle' })
      gooeyToast.error('Network error. Please try again.')
    }
  }, [])

  // Auto-resolve from ?from= search param on load
  useEffect(() => {
    const from = searchParams.get('from')
    if (from) {
      setInputValue(from)
      resolve(from)
    }
  }, [searchParams, resolve])

  const handleSubmit = () => {
    const val = inputValue.trim()
    if (!val) return
    router.replace(`?${new URLSearchParams({ from: val }).toString()}`, { scroll: false })
    resolve(val)
  }

  const handlePaste = (pasted: string) => {
    setInputValue(pasted)
    router.replace(`?${new URLSearchParams({ from: pasted }).toString()}`, { scroll: false })
    resolve(pasted)
  }

  const handleReset = () => {
    setState({ status: 'idle' })
    setInputValue('')
    router.replace('/', { scroll: false })
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <>
      <SongInput
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        onPaste={handlePaste}
        isLoading={state.status === 'loading'}
        inputRef={inputRef}
      />

      <div className="w-full max-w-2xl">
        {state.status === 'loading' && <SkeletonCard />}
        {state.status === 'success' && (
          <ResultCard data={state.data} onReset={handleReset} />
        )}
      </div>
    </>
  )
}
