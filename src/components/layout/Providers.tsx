"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { PreviewProvider } from "@/components/catalogue/PreviewProvider";

export function Providers({ children }: { children: ReactNode }) {
  // refetchOnWindowFocus (the default) is the cross-device sync strategy: when
  // you come back to the tab, watchlist and progress are fetched fresh.
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <PreviewProvider>{children}</PreviewProvider>
    </QueryClientProvider>
  );
}
