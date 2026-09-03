import { isEqual } from "lodash";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

export type SearchModel<Query> = {
  query: Query;
  setQuery: Dispatch<SetStateAction<Query>>;
};

export type SearchModelOptions<Query> = {
  href: string;
  encodeQuery: (query: Query, params: URLSearchParams) => void;
  decodeQuery: (params: ReadonlyURLSearchParams) => Query;
};

export const useSearchModel = <Query>({
  href,
  encodeQuery,
  decodeQuery,
}: SearchModelOptions<Query>): SearchModel<Query> => {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState<Query>(() => decodeQuery(searchParams));

  const synced = useRef(searchParams.toString());
  const decodeRef = useRef(decodeQuery);
  decodeRef.current = decodeQuery;

  /* Sync URL to state when the search string itself changes */
  useEffect(() => {
    const next = searchParams.toString();
    if (next === synced.current) return;
    synced.current = next;

    try {
      const decoded = decodeRef.current(searchParams);
      setQuery((prev) => (isEqual(prev, decoded) ? prev : decoded));
    } catch (error: unknown) {
      console.warn("Failed to decode search query from query string. Got error: ", error);
    }
  }, [searchParams]);

  /* State → URL */
  useEffect(() => {
    const params = new URLSearchParams();
    try {
      encodeQuery(query, params);
    } catch (error: unknown) {
      console.warn("Failed to encode query to query string. Got error: ", error);
      return;
    }

    const encoded = params.toString();
    if (encoded === synced.current) return;
    synced.current = encoded;

    const url = encoded === "" ? href : `${href}?${encoded}`;
    window.history.replaceState(window.history.state, "", url);
  }, [query, href, encodeQuery]);

  return { query, setQuery };
};
