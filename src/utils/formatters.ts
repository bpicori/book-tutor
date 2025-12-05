/** Format language map objects (e.g., { en: "Title" } → "Title") */
export const formatLanguageMap = (x: unknown): string => {
  if (!x) return ''
  if (typeof x === 'string') return x
  if (typeof x === 'object') {
    const keys = Object.keys(x)
    return (x as Record<string, string>)[keys[0]] || ''
  }
  return ''
}

/** Format a single contributor (string or object with name) */
const formatOneContributor = (contributor: unknown): string => {
  if (typeof contributor === 'string') return contributor
  if (typeof contributor === 'object' && contributor !== null) {
    return formatLanguageMap((contributor as { name?: unknown }).name)
  }
  return ''
}

/** Format contributor(s) - handles both single and array */
export const formatContributor = (contributor: unknown): string => {
  if (Array.isArray(contributor)) {
    return contributor.map(formatOneContributor).filter(Boolean).join(', ')
  }
  return formatOneContributor(contributor)
}

/** Convert blob to data URL for storage */
export const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

/** Generate a unique book ID */
export const generateBookId = (): string =>
  `book-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

