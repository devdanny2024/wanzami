/** Client component because we fetch signed URLs */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { authFetch } from "@/lib/authClient";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

const DEFAULT_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || "wanzami-bucket";
const DEFAULT_REGION = process.env.NEXT_PUBLIC_S3_REGION || "eu-north-1";

const resolveSrc = (src?: string) => {
  if (!src) return src;
  if (/^https?:\/\//i.test(src)) return src;
  const cleaned = src.replace(/^\/+/, "");
  return `https://${DEFAULT_BUCKET}.s3.${DEFAULT_REGION}.amazonaws.com/${cleaned}`;
};

const extractS3Key = (src?: string) => {
  if (!src) return null;
  if (!/^https?:\/\//i.test(src)) return src.replace(/^\/+/, "");
  try {
    const url = new URL(src);
    const hostParts = url.hostname.split(".");
    // Handle <bucket>.s3.<region>.amazonaws.com/<key>
    if (hostParts[1] === "s3") {
      return url.pathname.replace(/^\/+/, "");
    }
    return null;
  } catch {
    return null;
  }
};

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false);
  const [signedSrc, setSignedSrc] = useState<string | undefined>(undefined);
  const resolvedSrc = useMemo(() => resolveSrc(props.src?.toString()), [props.src]);

  useEffect(() => {
    let cancelled = false;
    setDidError(false);

    const fetchSigned = async () => {
      if (!props.src) return;
      const key = extractS3Key(props.src);
      if (!key) {
        setSignedSrc(props.src);
        return;
      }
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        const res = await authFetch("/admin/assets/get-url", {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ key }),
        });
        if (!res.ok || !res.data?.url) {
          if (!cancelled) setSignedSrc(resolvedSrc);
          return;
        }
        if (!cancelled) setSignedSrc(res.data.url ?? resolvedSrc);
      } catch (_err) {
        if (!cancelled) setSignedSrc(resolvedSrc);
      }
    };

    void fetchSigned();
    return () => {
      cancelled = true;
    };
  }, [props.src, resolvedSrc]);

  const handleError = () => {
    setDidError(true);
  };

  const { src: _ignored, alt, style, className, ...rest } = props;
  const finalSrc = signedSrc ?? resolvedSrc;

  return didError ? (
    <div className={`inline-block bg-gray-100 text-center align-middle ${className ?? ""}`} style={style}>
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={finalSrc} />
      </div>
    </div>
  ) : (
    <img src={finalSrc} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  );
}
