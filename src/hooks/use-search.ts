import { isEqual } from "lodash";
import { ReadonlyURLSearchParams, useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const [query, setQuery] = useState<Query>(decodeQuery(searchParams));
  const lastQuery = useRef<Query>();

  useEffect(() => {
    let query: Query;
    try {
      query = decodeQuery(searchParams);
    } catch (error: any) {
      console.warn("Failed to search query from query string. Got error: ", error);
      return;
    }

    setQuery(query);
  }, [decodeQuery, searchParams]);

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
