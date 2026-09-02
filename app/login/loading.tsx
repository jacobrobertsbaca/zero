import { Spinner } from "src/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex justify-center py-10">
      <Spinner className="size-6" />
    </div>
  );
}
