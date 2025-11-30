import React, { useMemo, useState } from "react";

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

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false);
  const resolvedSrc = useMemo(() => resolveSrc(props.src?.toString()), [props.src]);

  const handleError = () => {
    setDidError(true);
  };

  const { src: _ignored, alt, style, className, ...rest } = props;

  return didError ? (
    <div className={`inline-block bg-gray-100 text-center align-middle ${className ?? ""}`} style={style}>
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={resolvedSrc} />
      </div>
    </div>
  ) : (
    <img src={resolvedSrc} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  );
}
