import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Package } from "lucide-react";
import type { Product } from "@/lib/store";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

interface ProductCarouselProps {
  title: string;
  products: Product[];
  onAddToCart: (p: Product) => void;
  badge?: string;
}

const ProductCarousel = ({ title, products, onAddToCart, badge }: ProductCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    if (scrollWidth <= clientWidth) return;
    setProgress((scrollLeft / (scrollWidth - clientWidth)) * 100);
  };

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">{title}</h2>
        <div className="flex gap-1">
          <button onClick={() => scroll("left")} className="p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll("right")} className="p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
        {products.map((p, i) => (
          <div
            key={p.id + i}
            className="min-w-[180px] max-w-[180px] bg-card rounded-2xl border border-border overflow-hidden snap-start flex-shrink-0 group hover:shadow-lg transition-all duration-300 animate-fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="relative h-36 bg-secondary flex items-center justify-center overflow-hidden">
              {p.image ? (
                <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <Package className="w-12 h-12 text-muted-foreground" />
              )}
              {badge && (
                <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                  {badge}
                </span>
              )}
            </div>
            <div className="p-3 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-card-foreground truncate">{p.name}</p>
                <p className="text-primary font-bold">{formatPrice(p.price)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onAddToCart(p); }}
                className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-110 active:scale-90 transition-transform flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-secondary rounded-full overflow-hidden mx-auto max-w-[120px]">
        <div className="h-full bg-primary rounded-full transition-all duration-200" style={{ width: `${Math.max(progress, 10)}%` }} />
      </div>
    </section>
  );
};

export default ProductCarousel;
