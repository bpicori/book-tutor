/**
 * Router Service
 *
 * Bridges book-tutor's LLM provider configuration to free-tier-router.
 * Provides automatic failover between multiple configured providers.
 */

import {
  createRouter,
  type Router,
  type ProviderConfig as RouterProviderConfig,
} from "free-tier-router/browser";
import type { LLMProvider } from "../types";

let routerInstance: Router | null = null;

/**
 * Normalize a provider with default values for missing fields.
 * Ensures backward compatibility with older settings data.
 */
export const normalizeProvider = (
  provider: Partial<LLMProvider>,
  index: number
): LLMProvider => ({
  id: provider.id || `provider-${Date.now()}-${index}`,
  name: provider.name || `Provider ${index + 1}`,
  type: provider.type || "groq", // Default to groq for old/missing data
  apiKey: provider.apiKey || "",
  priority: provider.priority ?? index,
  enabled: provider.enabled ?? true,
});

/**
 * Normalize an array of providers with defaults.
 */
export const normalizeProviders = (
  providers: Array<Partial<LLMProvider>>
): LLMProvider[] => providers.map((p, i) => normalizeProvider(p, i));

/**
 * Initialize the router with the given providers.
 * Creates a router if at least one valid provider is configured.
 *
 * @param providers - Array of LLM providers from book-tutor settings
 */
export const initializeRouter = async (
  providers: Array<Partial<LLMProvider>>
): Promise<void> => {
  // Close existing router if any
  if (routerInstance) {
    await routerInstance.close();
    routerInstance = null;
  }

  // Normalize providers with defaults
  const normalizedProviders = normalizeProviders(providers);

  // Filter out disabled providers and those without API keys
  const validProviders = normalizedProviders.filter(
    (p) => p.enabled && p.apiKey && p.apiKey.trim() !== ""
  );

  if (validProviders.length === 0) {
    return;
  }

  // Sort by priority (lower = higher priority)
  const sortedProviders = [...validProviders].sort(
    (a, b) => a.priority - b.priority
  );

  // Map book-tutor providers to free-tier-router config
  const routerProviders: RouterProviderConfig[] = sortedProviders.map(
    (provider) => ({
      type: provider.type,
      apiKey: provider.apiKey,
      priority: provider.priority,
      enabled: provider.enabled,
    })
  );

  try {
    routerInstance = createRouter({
      providers: routerProviders,
      strategy: "priority",
      stateStore: { type: "memory" },
      throwOnExhausted: true,
      debug: true, // Set to true to enable detailed router logging
    });
  } catch {
    routerInstance = null;
  }
};

/**
 * Get the current router instance.
 * Returns null if no router is configured or available.
 */
export const getRouter = (): Router | null => routerInstance;

/**
 * Check if the router is available and ready to use.
 */
export const isRouterAvailable = (): boolean => routerInstance !== null;

/**
 * Close and cleanup the router instance.
 */
export const closeRouter = async (): Promise<void> => {
  if (routerInstance) {
    await routerInstance.close();
    routerInstance = null;
  }
};
