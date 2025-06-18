import { useEffect, useRef, useState } from "react";
import QuanTrak from "../assets/QuanTrak.jpg";
import OppoHack from "../assets/OpportunityHack.jpg";

export default function Project() {
  const scrollRef = useRef(null);
  const [centerIndex, setCenterIndex] = useState(0);

  const projects = [
    { title: "QuanTrak", img: QuanTrak },
    { title: "OppoHacks", img: OppoHack },
    { title: "EffortVLogger", img: null }, // No image yet
    { title: "AI vs Human Text", img: null },
  ];

  const projectStyle =
    "snap-center shrink-0 w-[85%] h-[250px] flex flex-col items-center justify-center  rounded-xl shadow transition-all duration-300 ease-in-out overflow-hidden";

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const children = Array.from(container.children);
      const containerCenter = container.scrollLeft + container.offsetWidth / 2;

      let closestIndex = 0;
      let minDistance = Infinity;

      children.forEach((child, index) => {
        const childCenter = child.offsetLeft + child.offsetWidth / 2;
        const distance = Math.abs(containerCenter - childCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      setCenterIndex(closestIndex);
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="flex snap-x snap-mandatory overflow-y-hidden overflow-x-scroll w-full h-full space-x-5 scroll-smooth items-center justify-start pl-[7.5%] pr-[7.5%]"
      ref={scrollRef}
    >
      {projects.map((project, index) => (
        <div
          key={project.title}
          className={`${projectStyle} ${
            index === centerIndex ? "opacity-100 scale-105" : "opacity-30"
          }`}
        >
          {project.img ? (
            <img
              src={project.img}
              alt={project.title}
              className="w-full h-full object-contain rounded-xl"
            />
          ) : (
            <div className="w-full h-[200px] bg-gray-300 rounded-md flex items-center justify-center text-black">
              No Image
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
