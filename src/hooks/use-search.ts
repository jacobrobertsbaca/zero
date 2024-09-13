import { isEqual } from "lodash";
import { ReadonlyURLSearchParams, useRouter, useSearchParams } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

export type SearchModel<Query> = {
  query: Query;
  setQuery: Dispatch<SetStateAction<Query>>;
};

export type SearchModelOptions<Query> = {
  href: string;
  defaultQuery: Query;
  encodeQuery: (query: Query, params: URLSearchParams) => void;
  decodeQuery: (params: ReadonlyURLSearchParams) => Query;
};

export const useSearchModel = <Query>({
  href,
  defaultQuery,
  encodeQuery,
  decodeQuery,
}: SearchModelOptions<Query>): SearchModel<Query> => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState<Query>(defaultQuery);
  const lastQuery = useRef<Query>();

  /* Load query from initial query URL on mount.
   * There is no need to run this when query params changes, as we assume
   * we're the only one updating the query params (so only way for them to
   * change otherwise is to change browser URL and reload page).
   */
  useEffect(
    () => {
      let query: Query;
      try {
        query = decodeQuery(searchParams);
      } catch (error: any) {
        console.warn("Failed to search query from query string. Got error: ", error);
        return;
      }

      if (isEqual(query, lastQuery.current)) return;
      lastQuery.current = query;
      setQuery(query);
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    []
  );

  /* Update query params when state changes */
  useEffect(() => {
    if (isEqual(query, lastQuery.current)) return;
    lastQuery.current = query;

    const params = new URLSearchParams();

    try {
      encodeQuery(query, params);
    } catch (error: any) {
      console.warn("Failed to encode query to query string. Got error: ", error);
      return;
    }

    let encoded = params.toString();
    if (encoded !== "") encoded = `?${encoded}`;
    router.replace(`${href}${encoded}`);
  }, [query, router, href, encodeQuery]);

  return { query, setQuery };
};
