import { useCallback, useRef } from "react";
import useSWR, { BareFetcher, SWRConfiguration, type Key } from "swr";
import { FetcherResponse } from "swr/dist/_internal";

export const useInfinite = <Data = any, Error = any>(
  key: Key,
  fetcher: (prevPage: Data | undefined) => FetcherResponse<Data | null>,
  config: SWRConfiguration<Data[], Error, BareFetcher<Data[]>>
) => {
  const pages = useRef(1);
  const swr = useSWR(
    key,
    async () => {
      const data: Data[] = [];
      let prevPage: Data | undefined = undefined;

      for (let i = 0; i < pages.current; i++) {
        const page = await fetcher(prevPage);
        if (page === null) break;
        data.push(page);
        prevPage = page;
      }

      return data;
    },
    config
  );

  const fetchNext = useCallback(async () => {
    // Do not allow fetching next page if data is loading or we are currently doing so already
    if (swr.isLoading || swr.isValidating) return;
    await swr.mutate(
      async (data) => {
        const numPages = pages.current;
        const prevPage = data?.length ? data[data.length - 1] : undefined;
        const nextPage = await fetcher(prevPage);
        if (nextPage === null) return data;
        pages.current = numPages + 1;
        return [...(data ?? []), nextPage];
      },
      { revalidate: false }
    );
  }, [swr.isLoading, swr.isValidating]);

  return { ...swr, fetchNext };
};
