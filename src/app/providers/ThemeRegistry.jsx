"use client";

import * as React from "react";
import { useServerInsertedHTML } from "next/navigation";
import { CacheProvider } from "@emotion/react";
import createEmotionServer from "@emotion/server/create-instance";
import theme from "@/theme"; // Your custom theme file
import { createEmotionCache } from "@/utils/createEmotionCache"; // The Emotion cache factory
import { ThemeProvider } from "@mui/material/styles"; // The Material UI ThemeProvider

// This variable will hold the client-side Emotion cache.
// It's created once and reused for the entire application lifecycle on the client.
let clientSideEmotionCache;

// This function creates or reuses the client-side cache.
function getEmotionCache() {
  if (typeof window !== "undefined") {
    if (!clientSideEmotionCache) {
      clientSideEmotionCache = createEmotionCache();
    }
    return clientSideEmotionCache;
  }
  return createEmotionCache();
}

export default function ThemeRegistry({ children }) {
  const cache = getEmotionCache();
  const { extractCriticalToChunks } = React.useMemo(() => {
    // This is a memoized instance of the Emotion server for server-side rendering.
    // It's crucial for collecting styles for a single render pass.
    return createEmotionServer(cache);
  }, [cache]);

  // This hook runs on the server to collect and inject styles.
  useServerInsertedHTML(() => {
    const { styles } = extractCriticalToChunks(children);

    if (styles.length === 0) {
      return null;
    }

    return (
      <style
        data-emotion={`${cache.key} ${styles
          .map((style) => style.ids.join(" "))
          .join(" ")}`}
        dangerouslySetInnerHTML={{
          __html: styles.map((style) => style.css).join(" "),
        }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </CacheProvider>
  );
}
