'use client';

import Image from "next/image";
import { motion, useMotionValue, useTransform, useAnimationFrame } from "framer-motion";
import { wrap } from "@motionone/utils";
import { useRef, useState, useEffect } from "react";

export default function BrandsMarquee() {
  const brands = [
    "brand1.png", "brand2.png", "brand3.png", "brand4.png", "brand5.png",
    "brand6.jpeg", "brand7.png", "brand8.png", "brand9.jpg", "brand10.jpeg",
    "brand11.jpg", "brand12.png", "brand13.png", "brand14.jpg", "brand15.png",
    "brand16.jpeg", "brand17.jpg", "brand18.png", "brand19.jpg", "brand20.png",
    "brand21.jpg", "brand22.jpeg", "brand23.png", "brand24.png", "brand25.jpeg",
    "brand26.png", "brand27.png"
  ];

  const duplicatedBrands = [...brands, ...brands, ...brands];
  
  const baseX = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragSurfaceRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const isDraggingRef = useRef(false);
  const lastPointerXRef = useRef<number | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      setContentWidth(containerRef.current.scrollWidth / 3);
    }
  }, []);

  useAnimationFrame((t, delta) => {
    if (contentWidth > 0 && !isDraggingRef.current) {
      let moveBy = -1.2 * (delta / 16);
      baseX.set(baseX.get() + moveBy);
    }
  });

  const x = useTransform(baseX, (v) => `${wrap(-contentWidth, 0, v)}px`);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    lastPointerXRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || lastPointerXRef.current === null) return;
    const deltaX = e.clientX - lastPointerXRef.current;
    baseX.set(baseX.get() + deltaX);
    lastPointerXRef.current = e.clientX;
  };

  const stopDragging = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    lastPointerXRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div
      ref={dragSurfaceRef}
      className="relative overflow-hidden cursor-grab active:cursor-grabbing touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
    >
      <motion.div
        ref={containerRef}
        className="flex items-center py-6 whitespace-nowrap"
        style={{ x }}
      >
        {duplicatedBrands.map((brand, index) => (
          <div
            key={index}
            className="flex-shrink-0 mx-10 md:mx-20 select-none"
          >
            <Image
              src={`/brands/${brand}`}
              alt="Brand Logo"
              width={280}
              height={110}
              className="h-20 md:h-28 w-auto object-contain"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}