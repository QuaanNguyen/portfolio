export default function Copyright() {
  const currentYear = new Date().getFullYear();
  return (
    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-center text-base text-gray-600 dark:text-gray-100 transition-colors select-none">
      &copy; {currentYear} Quan Nguyen
    </div>
  );
}
