import { Separator } from "src/components/ui/separator";
import { Spinner } from "src/components/ui/spinner";

type LoadingPropsBase = {
  error?: any;
};

type LoadingPropsWithoutValue = {
  loading?: boolean;
  children?: React.ReactNode;
};

type LoadingPropsWithValue<T> = {
  value: T;
  children: (value: NonNullable<T>) => React.ReactNode;
};

export type LoadingProps<T = unknown> = LoadingPropsBase & (LoadingPropsWithoutValue | LoadingPropsWithValue<T>);

export const Loading = <T,>(props: LoadingProps<T>) => {
  const { error } = props;
  if (typeof props.children === "function") {
    const { value } = props as LoadingPropsWithValue<T>;
    if (value) return <>{props.children(value)}</>;
  } else {
    const { loading } = props as LoadingPropsWithoutValue;
    if (loading !== undefined && !loading) return <>{props.children}</>;
  }

  return (
    <div className="my-6">
      <Separator />
      <div className="flex h-12 flex-col items-center justify-center gap-1 py-6">
        {error ? (
          <>
            <p className="text-sm text-foreground">Oops. An error occurred.</p>
            {error.message && <p className="text-xs text-muted-foreground">{error.message}</p>}
          </>
        ) : (
          <Spinner className="size-[22px]" />
        )}
      </div>
      <Separator />
    </div>
  );
};
