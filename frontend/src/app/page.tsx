
"use client";

import { useState, type ChangeEvent } from "react";

type Product = {
  filename: string;
  similarity: number;
};

type SearchResponse = {
  message: string;
  query_image: string;
  total_results: number;
  results: Product[];
};

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    if (
      !["image/jpeg", "image/png"].includes(selectedFile.type)
    ) {
      setError("Please select a JPG or PNG image.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    setFile(selectedFile);
    setResults([]);
    setSearched(false);
    setError("");

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result as string);
    };

    reader.readAsDataURL(selectedFile);
  }

  async function handleSearch() {
    if (!file) {
      setError("Please upload an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);
    setSearched(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "http://127.0.0.1:8000/search-image",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail || "AI search failed."
        );
      }

      const data: SearchResponse = await response.json();

      setResults(data.results);
      setSearched(true);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the AI backend."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <h1 className="text-2xl font-bold text-indigo-600">
            VisionSearch AI
          </h1>

          <span className="text-sm text-slate-500">
            AI-Powered Product Discovery
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-16 text-center">

        <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
          Powered by CLIP AI
        </span>

        <h2 className="mt-8 text-4xl font-bold md:text-6xl">
          Discover Products{" "}
          <span className="text-indigo-600">
            Visually
          </span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          Upload an image and discover similar products
          using Artificial Intelligence.
        </p>

        <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">

          <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50 p-8">

            {image ? (
              <img
                src={image}
                alt="Uploaded product preview"
                className="mx-auto max-h-64 rounded-xl object-contain"
              />
            ) : (
              <div>
                <div className="text-5xl">📸</div>

                <h3 className="mt-4 text-xl font-semibold">
                  Upload Product Image
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Click to select a JPG or PNG image
                </p>
              </div>
            )}

            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-indigo-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading
              ? "AI is searching..."
              : "Search Similar Products"}
          </button>

          <p className="mt-4 text-xs text-slate-400">
            Maximum image size: 5 MB
          </p>

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

        </div>

        {searched && (
          <div className="mt-16">

            <h3 className="text-3xl font-bold">
              AI Search Results
            </h3>

            <p className="mt-3 text-slate-500">
              Found {results.length} similar products
            </p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {results.map((product, index) => (
                <div
                  key={product.filename}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                 
<div className="mb-4 flex h-48 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
  {/* Product photos are served by our FastAPI backend */}
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img
    src={`http://127.0.0.1:8000/products/${encodeURIComponent(
      product.filename
    )}`}
    alt={product.filename}
    className="h-full w-full object-contain"
    loading="lazy"
  />
</div>


                  <p className="text-sm font-medium text-indigo-600">
                    Match #{index + 1}
                  </p>

                  <h4 className="mt-2 break-words text-lg font-semibold">
                    {product.filename}
                  </h4>

                  <p className="mt-4 text-sm text-slate-500">
                    Cosine Similarity
                  </p>

                  <p className="mt-1 text-2xl font-bold text-indigo-600">
                    {product.similarity.toFixed(4)}
                  </p>

                </div>
              ))}

            </div>
          </div>
        )}

      </section>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        VisionSearch AI — Intelligent Product Discovery
      </footer>

    </main>
  );
}
