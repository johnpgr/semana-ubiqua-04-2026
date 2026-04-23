import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Spinner className="size-8 text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Carregando informações...
        </p>
      </div>
    </div>
  );
}
