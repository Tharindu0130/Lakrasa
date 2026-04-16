"use client";

type ProductImagesProps = {
  title: string;
  images: string[];
  selectedImage: string;
  setSelectedImage: (img: string) => void;
};

export default function ProductImages({
  title,
  images,
  selectedImage,
  setSelectedImage,
}: ProductImagesProps) {
  return (
    <div>
      <div className="w-full h-[450px] rounded-2xl overflow-hidden bg-white shadow-sm">
        {selectedImage ? (
          <img
            src={selectedImage}
            alt={title}
            className="w-full h-full object-cover transition duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gray-200"></div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {images.map((img) => (
          <button
            key={img}
            type="button"
            onClick={() => setSelectedImage(img)}
            className={`h-28 rounded-xl overflow-hidden border-2 transition ${
              selectedImage === img
                ? "border-green-700"
                : "border-transparent hover:border-green-400"
            }`}
          >
            <img src={img} alt={title} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
