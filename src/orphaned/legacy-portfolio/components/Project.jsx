import QuanTrak from "../assets/QuanTrak.jpg";
import OppoHack from "../assets/OpportunityHack.jpg";

export default function Project() {
  const projects = [
    { title: "QuanTrak", img: QuanTrak },
    { title: "OppoHacks", img: OppoHack },
  ];

  const card =
    "snap-center shrink-0 w-[80%] h-full rounded-xl shadow overflow-hidden flex items-center justify-center";

  return (
    <div
      className="
        flex snap-x snap-mandatory overflow-x-scroll overflow-y-hidden
        w-full h-full gap-10 scroll-smooth
      "
    >
      {projects.map((p) => (
        <div key={p.title} className={card}>
          {p.img ? (
            <img src={p.img} alt={p.title} />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-black">
              No Image
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
