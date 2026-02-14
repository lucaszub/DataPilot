"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Une erreur est survenue
        </h2>
        <p className="text-sm text-gray-500 mb-4">{error.message}</p>
        <button
          onClick={reset}
          className="rounded-md bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700"
        >
          Reessayer
        </button>
      </div>
    </div>
  );
}
