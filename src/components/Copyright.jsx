export default function Copyright() {
  const currentYear = new Date().getFullYear();
  return (
    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-center text-base text-gray-600 dark:text-gray-100 transition-colors select-none">
      <p className="mb-1 break-normal">
        Made with React.js and Tailwind. Give me a star{" "}
        <a
          className="underline font-bold text-yellow-400"
          href="https://github.com/QuaanNguyen/portfolio"
        >
          here
        </a>{" "}
        &#11088;
      </p>
      <p>&copy; {currentYear} Quan Nguyen</p>
    </div>
  );
}
