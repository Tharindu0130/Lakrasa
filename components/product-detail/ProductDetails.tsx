"use client";

type ProductDetailsProps = {
  title: string;
  priceLkr: number;
  stockStatus: string;
  description: string;
  quantity: number;
  setQuantity: (qty: number) => void;
  onAddToCart: () => void;
};

export default function ProductDetails({
  title,
  priceLkr,
  stockStatus,
  description,
  quantity,
  setQuantity,
  onAddToCart,
}: ProductDetailsProps) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm h-fit border border-gray-100">
      <p className="text-[10px] tracking-[0.28em] uppercase text-gray-500 mb-2">
        Lakrasa Ceylon
      </p>
      <h1 className="text-4xl leading-tight font-serif text-gray-900">{title}</h1>

      <div className="flex items-center gap-2 mt-4">
        <span className="text-[#c9a227] text-sm tracking-[0.15em]">★★★★★</span>
        <span className="text-xs uppercase tracking-[0.2em] text-gray-500">9 Reviews</span>
      </div>

      <p className="text-2xl text-green-700 font-semibold mt-4">
        Rs. {priceLkr.toLocaleString("en-LK")}
      </p>

      <p className="text-sm text-gray-500 mt-2 capitalize">
        {stockStatus.replaceAll("_", " ")}
      </p>

      <p className="text-gray-700 mt-6 leading-relaxed">{description}</p>

      <div className="mt-8">
        <p className="text-sm font-medium text-black mb-2">Quantity</p>
        <div className="inline-flex items-center border border-black rounded-lg overflow-hidden">
          <button
            type="button"
            className="px-4 py-2 text-black hover:bg-black hover:text-white transition"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            -
          </button>
          <span className="px-5 py-2 min-w-12 text-center text-black">{quantity}</span>
          <button
            type="button"
            className="px-4 py-2 text-black hover:bg-black hover:text-white transition"
            onClick={() => setQuantity(quantity + 1)}
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onAddToCart}
        className="mt-8 w-full bg-green-700 text-white py-3 rounded-lg font-medium hover:bg-green-800 transition"
      >
        Add to Cart
      </button>
    </div>
  );
}
