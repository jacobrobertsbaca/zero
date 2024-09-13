import { MutableRefObject, useEffect, useRef } from "react";
import Router from "next/router";
import nProgress from "nprogress";

const ignoreQuery = (pathRef: MutableRefObject<string | undefined>, func: () => any) => (url: any) => {
  /** If url is not a string, then we can't do any path-dependent logic. */
  console.log(url);
  if (typeof url === "string") {
    const path = url.split("?")[0];
    if (pathRef.current === path) return;
    pathRef.current = path;
  }
  return func();
};

export function useNProgress() {
  const startPath = useRef<string>();
  const endPath = useRef<string>();

  useEffect(() => {
    const onRouteStart = ignoreQuery(startPath, () => { console.log("start"); nProgress.start(); });
    const onRouteComplete = ignoreQuery(endPath, () => { console.log("end"); nProgress.done(); });

    Router.events.on("routeChangeStart", onRouteStart);
    Router.events.on("routeChangeError", onRouteComplete);
    Router.events.on("routeChangeComplete", onRouteComplete);

    return () => {
      Router.events.off("routeChangeStart", onRouteStart);
      Router.events.off("routeChangeError", onRouteComplete);
      Router.events.off("routeChangeComplete", onRouteComplete);
    };
  }, []);
}
