/**
 * Type for language map objects: { en: "Title", de: "Titel" }
 */
type LanguageMap = Record<string, string>

/**
 * Type for metadata values that can be formatted
 */
type MetadataValue = string | LanguageMap | Array<string | { name?: string | LanguageMap }> | { name?: string | LanguageMap } | null | undefined

/**
 * Format language map objects (e.g., { en: "Title" } → "Title")
 * 
 * @param x - Language map object or string
 * @returns First available string value, or empty string
 * 
 * @example
 * ```typescript
 * formatLanguageMap({ en: "Title", de: "Titel" }) // "Title"
 * formatLanguageMap("Title") // "Title"
 * ```
 */
export const formatLanguageMap = (x: MetadataValue): string => {
  if (!x) return ''
  if (typeof x === 'string') return x
  if (typeof x === 'object' && !Array.isArray(x)) {
    const keys = Object.keys(x)
    return (x as LanguageMap)[keys[0]] || ''
  }
  return ''
}

/**
 * Format a single contributor (string or object with name)
 */
const formatOneContributor = (contributor: MetadataValue): string => {
  if (typeof contributor === 'string') return contributor
  if (typeof contributor === 'object' && contributor !== null && !Array.isArray(contributor)) {
    return formatLanguageMap((contributor as { name?: MetadataValue }).name)
  }
  return ''
}

/**
 * Format contributor(s) - handles both single and array
 * 
 * @param contributor - Contributor value (string, object, or array)
 * @returns Formatted contributor string
 * 
 * @example
 * ```typescript
 * formatContributor("John Doe") // "John Doe"
 * formatContributor(["John Doe", "Jane Smith"]) // "John Doe, Jane Smith"
 * formatContributor({ name: "John Doe" }) // "John Doe"
 * ```
 */
export const formatContributor = (contributor: MetadataValue): string => {
  if (Array.isArray(contributor)) {
    return contributor.map(formatOneContributor).filter(Boolean).join(', ')
  }
  return formatOneContributor(contributor)
}

/**
 * Convert blob to data URL for storage
 * 
 * @param blob - Blob to convert
 * @returns Promise resolving to data URL string
 */
export const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

/**
 * Generate a unique book ID
 * 
 * @returns Unique book identifier string
 * @example "book-1234567890-abc123"
 */
export const generateBookId = (): string =>
  `book-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

