import { A } from "../components/link";

/** Reached only from the console and other coded routes. Public paths get the designed 404 from the catch-all. */
export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <h1 className="text-3xl font-bold">That page isn&apos;t here</h1>
      <p className="mt-4"><A href="/" className="underline underline-offset-4">Go to the home page</A></p>
    </main>
  );
}
