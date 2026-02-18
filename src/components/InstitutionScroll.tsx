import AutoScroll from "embla-carousel-auto-scroll";
import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel";

const institutions = [
  { id: "1", name: "IIT Delhi" },
  { id: "2", name: "IIM Ahmedabad" },
  { id: "3", name: "BITS Pilani" },
  { id: "4", name: "NIT Trichy" },
  { id: "5", name: "VIT Vellore" },
  { id: "6", name: "IISc Bangalore" },
  { id: "7", name: "NSIT Delhi" },
  { id: "8", name: "IIT Bombay" },
  { id: "9", name: "IIM Bangalore" },
  { id: "10", name: "BITS Goa" },
  { id: "11", name: "NIT Surathkal" },
  { id: "12", name: "IIT Madras" },
];

export default function InstitutionScroll() {
  return (
    <div className="relative z-10 border-t border-white/[0.04] py-6 overflow-hidden">
      <p className="text-center text-[10px] text-white/50 font-medium tracking-widest uppercase mb-5">
        Trusted by candidates from India's leading institutions
      </p>
      <div className="relative">
        <Carousel
          opts={{ loop: true, dragFree: true }}
          plugins={[AutoScroll({ playOnInit: true, speed: 1, stopOnInteraction: false })]}
          className="w-full"
        >
          <CarouselContent className="-ml-0">
            {institutions.map((inst) => (
              <CarouselItem
                key={inst.id}
                className="basis-auto pl-0"
              >
                <div className="mx-8 flex items-center justify-center">
                  <span className="text-sm font-bold text-white/60 tracking-widest whitespace-nowrap hover:text-white/90 transition-colors cursor-default">
                    {inst.name}
                  </span>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#030712] to-transparent pointer-events-none z-10" />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#030712] to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}
