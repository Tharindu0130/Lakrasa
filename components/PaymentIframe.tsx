"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type PaymentIframeProps = {
  src: string;
  title?: string;
  onLoad?: () => void;
  /** Increment to force a fresh iframe load (retry). */
  reloadToken?: number;
};

export function PaymentIframe({ src, title = "WebX Pay", onLoad, reloadToken = 0 }: PaymentIframeProps) {
  const [isFrameLoading, setIsFrameLoading] = useState(true);

  useEffect(() => {
    setIsFrameLoading(true);
  }, [src, reloadToken]);

  const handleLoad = useCallback(() => {
    setIsFrameLoading(false);
    onLoad?.();
  }, [onLoad]);

  if (!src) {
    return (
      <div className="flex h-[min(600px,70vh)] w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500">
        Preparing secure checkout…
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {isFrameLoading ? (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-gray-50 to-white px-6"
          aria-busy="true"
          aria-label="Loading payment"
        >
          <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
          <div className="h-3 w-48 max-w-full animate-pulse rounded-full bg-gray-200" />
          <div className="h-3 w-36 max-w-full animate-pulse rounded-full bg-gray-100" />
          <Loader2 className="h-6 w-6 animate-spin text-green-700" />
          <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
            Initializing WebX Pay
          </p>
        </div>
      ) : null}

      <iframe
        key={`${src}-${reloadToken}`}
        title={title}
        src={src}
        onLoad={handleLoad}
        className="block h-[min(600px,70vh)] w-full border-0 bg-white"
        allow="payment *"
      />
    </div>
  );
}
