import { useCallback, useMemo } from "react";
import useSWR, { type BareFetcher, type SWRConfiguration, type Key, useSWRConfig } from "swr";
import { type FetcherResponse } from "swr/dist/_internal";

export const useInfinite = <Page = any, Error = any>(
  key: Key,
  fetcher: (prevPage: Page | undefined) => FetcherResponse<Page | null>,
  config: SWRConfiguration<Page[], Error, BareFetcher<Page[]>>
) => {
  const cacheKey = useMemo(() => JSON.stringify(key), [key]);
  const { cache } = useSWRConfig();

  const swr = useSWR(
    cacheKey,
    async () => {
      const stalePages = cache.get(cacheKey) as Page[] | undefined;
      const staleCount = stalePages?.length ?? 1;

      const pages: Page[] = [];
      let prevPage: Page | undefined = undefined;

      for (let i = 0; i < staleCount; i++) {
        const page = await fetcher(prevPage);
        if (page === null) break;
        pages.push(page);
        prevPage = page;
      }

      return pages;
    },
    config
  );

  const fetchNext = useCallback(async () => {
    // Do not allow fetching next page if data is loading or we are currently doing so already
    if (swr.isLoading || swr.isValidating) return;
    await swr.mutate(
      async (pages) => {
        const prevPage = pages?.length ? pages[pages.length - 1] : undefined;
        const nextPage = await fetcher(prevPage);
        if (nextPage === null) return pages;
        return [...(pages ?? []), nextPage];
      },
      { revalidate: false }
    );
  }, [swr.isLoading, swr.isValidating, swr.mutate, fetcher]);

  return { ...swr, fetchNext };
};
