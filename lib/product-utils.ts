const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export type ProductImageRow = {
  image_url?: string | null;
  sort_order?: number | null;
};

export function normalizePublicImageUrl(raw: string | null | undefined): string {
  if (!raw) return "";
  const value = raw.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;

  const base = SUPABASE_URL.replace(/\/+$/, "");
  const cleaned = value.replace(/^\/+/, "");

  if (cleaned.startsWith("storage/v1/object/public/")) {
    return `${base}/${cleaned}`;
  }
  if (cleaned.startsWith("products/")) {
    return `${base}/storage/v1/object/public/${cleaned}`;
  }
  if (!cleaned.includes("/")) {
    return `${base}/storage/v1/object/public/products/${cleaned}`;
  }
  return value;
}

export function getSortedImageUrls(
  images: ProductImageRow[] | null | undefined
): string[] {
  return (images ?? [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((img) => normalizePublicImageUrl(img.image_url))
    .filter(Boolean);
}
