"use client";

type ProductFiltersProps = {
  categories: { id: string; name: string }[];
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  maxPrice: string;
  setMaxPrice: (value: string) => void;
  maxPossiblePrice: number;
  sortBy: string;
  setSortBy: (value: string) => void;
};

export default function ProductFilters(props: ProductFiltersProps) {
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    maxPrice,
    setMaxPrice,
    maxPossiblePrice,
    sortBy,
    setSortBy,
  } = props;

  const inputClasses = "bg-white border border-black rounded-xl px-3 py-1.5 text-sm text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-700/20 transition-all w-full hover:border-green-600 cursor-pointer appearance-none";

  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 mb-8 relative">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end relative z-10">
        {/* Category Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={inputClasses}
          >
            <option value="" className="bg-white text-black">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-white text-black">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={inputClasses}
          >
            <option value="default" className="bg-white text-black">Sort: Default</option>
            <option value="price_asc" className="bg-white text-black">Price: Low to High</option>
            <option value="price_desc" className="bg-white text-black">Price: High to Low</option>
          </select>
        </div>

        {/* Price Slider */}
        <div className="flex flex-col gap-1 lg:col-span-2">
          <div className="flex justify-between items-center ml-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Price Range</label>
            <span className="text-xs font-semibold text-black">Under LKR {Number(maxPrice).toLocaleString()}</span>
          </div>
          <div className="relative pt-1 flex items-center h-8">
            <input
              type="range"
              min={0}
              max={maxPossiblePrice}
              step={Math.ceil(maxPossiblePrice / 100)}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-700 transition-all"
            />
          </div>
          <div className="flex justify-between px-1 -mt-1">
            <span className="text-[9px] text-gray-400">0</span>
            <span className="text-[9px] text-gray-400">{maxPossiblePrice.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
