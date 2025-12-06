/**
 * IndexedDB storage for book files.
 * Since epub files can be large, we store them in IndexedDB
 * while keeping metadata in localStorage via zustand persist.
 */

import { DB_NAME, DB_VERSION, DB_STORE_NAME } from '../constants'

const STORE_NAME = DB_STORE_NAME

interface StoredBook {
  id: string
  data: ArrayBuffer
}

let dbCache: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  // Return cached connection if available
  if (dbCache) {
    return Promise.resolve(dbCache)
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbCache = request.result
      resolve(dbCache)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

/**
 * Close the database connection (useful for cleanup)
 */
export function closeDB(): void {
  if (dbCache) {
    dbCache.close()
    dbCache = null
  }
}

export async function saveBookFile(id: string, file: File): Promise<void> {
  const db = await openDB()
  const data = await file.arrayBuffer()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const request = store.put({ id, data } as StoredBook)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getBookFile(id: string): Promise<File | null> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    const request = store.get(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const result = request.result as StoredBook | undefined
      if (result) {
        // Convert ArrayBuffer back to File
        const blob = new Blob([result.data], { type: 'application/epub+zip' })
        const file = new File([blob], `${id}.epub`, { type: 'application/epub+zip' })
        resolve(file)
      } else {
        resolve(null)
      }
    }
  })
}

export async function deleteBookFile(id: string): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const request = store.delete(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getAllBookIds(): Promise<string[]> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    const request = store.getAllKeys()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result as string[])
  })
}

