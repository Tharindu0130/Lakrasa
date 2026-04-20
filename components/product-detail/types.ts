import { ProductImageRow } from "@/lib/product-utils";

export type ProductRow = {
  id: string;
  title: string;
  price_lkr: number;
  description?: string | null;
  description_full?: string | null;
  stock_status?: string | null;
  category_id?: string | null;
  categories?: { id: string; name: string } | { id: string; name: string }[] | null;
  product_images?: ProductImageRow[] | null;
};
