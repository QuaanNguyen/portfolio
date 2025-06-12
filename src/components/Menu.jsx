import ProfilePic from "../assets/picture.JPEG";

export default function Menu() {
  const sectionStyle =
    "overflow-hidden w-full h-full flex items-center justify-center p-6 rounded-xl shadow-lg";

  return (
    <div className="absolute top-[90px] left-0 w-full h-[calc(100vh-150px)] flex justify-center">
      <div className="grid grid-flow-col grid-cols-3 grid-rows-3 gap-5 text-black dark:text-white transition-colors duration-0 w-full px-8">
        {/* About Me Section */}
        <div className={`row-span-2 row-start-1 ${sectionStyle}`}>
          <div className="max-w-8/9 leading-relaxed">
            <h2 className="text-2xl font-bold mb-4 text-left">about me</h2>
            <p className="mb-4">
              I am currently a <a className="font-semibold">full stack engineer</a>, looking for new grad opportunities in the US.
              <br />
              <br />
              I have done two internships, both about building solutions for stakeholders, focused on <a className="font-semibold">optimizing system</a>. My mission is to build products that make people's lives easier and more enjoyable.
              <br />
              <br />
              In order to achieve that, I take great care in understanding the needs of users, and pay attention to <a className="font-semibold">system design and architecture</a>.
            </p>

            <h2 className="text-2xl font-bold mt-4 mb-4 text-left">
              language proficiency
            </h2>
            <p className="mb-4">
              i have native fluency in{" "}
              <a className="font-semibold underline underline-offset-1">
                English
              </a>{" "}
              and{" "}
              <a className="font-semibold underline underline-offset-1">
                Vietnamese
              </a>
              , and can perform conversational{" "}
              <a className="font-semibold underline underline-offset-1">
                Japanese
              </a>
              .
            </p>
          </div>
        </div>

        {/* Profile Section */}
        <div
          className={`row-span-2 col-start-2 ${sectionStyle} flex-col justify-evenly`}
        >
          <img
            src={ProfilePic}
            alt="Profile"
            className="w-85 h-85 object-cover rounded-2xl shadow-lg mb-3"
          />
          <div className="text-center text-4xl font-bold">Quan Nguyen</div>
          <div className="text-center text-lg text-gray-700 dark:text-gray-300">
            developer · AI enthusiast · community builder
          </div>
        </div>

        {/* Projects */}
        <div className={`bg-blue-500 col-span-2 row-start-3 ${sectionStyle}`}>
          <span className="text-xl font-semibold">Projects</span>
        </div>

        {/* Work Experience */}
        <div className={`bg-orange-500 row-span-2 col-start-3 ${sectionStyle}`}>
          <span className="text-xl font-semibold text-center">
            Work Experience
          </span>
        </div>

        {/* Tech Stack */}
        <div className={`bg-red-500 row-start-3 col-start-3 ${sectionStyle}`}>
          <span className="text-xl font-semibold">Tech Stack</span>
        </div>
      </div>
    </div>
  );
}
