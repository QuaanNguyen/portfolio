export default function Menu() {
  const sectionStyle = "";
  return (
    <div className="absolute top-[90px] left-0 w-full h-[calc(100vh-150px)] grid grid-flow-col grid-cols-3 grid-rows-3 gap-5 text-black dark:text-white transition-colors">
      <div className="bg-purple-500 row-span-2 row-start-1">about/mission</div>
      <div className="bg-green-500 row-span-2 col-start-2">picture/role</div>
      <div className="bg-blue-500 col-span-2 row-start-3">projects</div>
      <div className="bg-orange-500 row-span-2 col-start-3">work experience</div>
      <div className="bg-red-500 row-start-3 col-start-3">tech stack</div>
    </div>
  );
}
