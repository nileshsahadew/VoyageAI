// src/utils/createEmotionCache.js

import createCache from "@emotion/cache";

// This function is useful for creating a new Emotion cache instance.
// It's used to avoid a hydration mismatch in Next.js applications.
export const createEmotionCache = () => {
  return createCache({ key: "css", prepend: true });
};