import Comment from "../components/Comment";
import LegacyLayout from "./LegacyLayout";

export default function LegacyGuestbookPage() {
  return (
    <LegacyLayout>
      <main className="relative z-10 mx-auto h-[calc(100vh-7rem)] w-[min(92vw,72rem)] p-4 md:p-8">
        <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/75">
          <h1 className="px-6 pt-6 text-3xl font-bold text-gray-800 dark:text-white">
            guestbook
          </h1>
          <div className="min-h-0 flex-1">
            <Comment />
          </div>
        </section>
      </main>
    </LegacyLayout>
  );
}
