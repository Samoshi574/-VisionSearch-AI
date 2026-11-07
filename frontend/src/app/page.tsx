
"use client";

import { useState, type ChangeEvent } from "react";

type Product = {
  filename: string;
  similarity: number;
};

type SearchResponse = {
  message: string;
  results: Product[];
  total_results: number;
};

type SearchMode = "image" | "text";

const API_URL = "http://127.0.0.1:8000";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function getErrorMessage(error: unknown): string {
  if (error instanceof TypeError) {
    return "Cannot connect to the AI backend. Check FastAPI.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

function getSearchButtonLabel(
  loading: boolean,
  mode: SearchMode
): string {
  if (loading) {
    return "AI is searching...";
  }

  if (mode === "image") {
    return "Search Similar Products";
  }

  return "Search Products by Text";
}

function getProductName(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replaceAll("_", " ");
}

async function performSearch(
  mode: SearchMode,
  file: File | null,
  query: string
): Promise<Product[]> {
  let response: Response;

  if (mode === "image") {
    if (!file) {
      throw new Error("Please upload an image first.");
    }

    const formData = new FormData();
    formData.append("file", file);

    response = await fetch(`${API_URL}/search-image`, {
      method: "POST",
      body: formData,
    });
  } else {
    response = await fetch(`${API_URL}/search-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query.trim(),
      }),
    });
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    let message = "AI search failed. Please try again.";

    if (typeof errorData?.detail === "string") {
      message = errorData.detail;
    }

    throw new Error(message);
  }

  const data: SearchResponse = await response.json();

  return data.results;
}

type ImageSearchInputProps = Readonly<{
  image: string | null;
  loading: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}>;

function ImageSearchInput({
  image,
  loading,
  onChange,
}: ImageSearchInputProps) {
  return (
    <div>
      <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50 p-8 transition hover:border-indigo-500">
        {image ? (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt="Selected product"
              className="mx-auto max-h-64 rounded-xl object-contain"
            />

            <p className="mt-4 text-sm text-indigo-600">
              Click to change image
            </p>
          </div>
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
          onChange={onChange}
          disabled={loading}
          className="hidden"
        />
      </label>

      <p className="mt-4 text-xs text-slate-400">
        Maximum image size: 5 MB
      </p>
    </div>
  );
}

type TextSearchInputProps = Readonly<{
  query: string;
  loading: boolean;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
}>;

function TextSearchInput({
  query,
  loading,
  onQueryChange,
  onSearch,
}: TextSearchInputProps) {
  return (
    <div className="text-left">
      <label
        htmlFor="product-query"
        className="mb-3 block text-sm font-semibold text-slate-700"
      >
        Describe the product you want to find
      </label>

      <input
        id="product-query"
        type="text"
        value={query}
        onChange={(event) => {
          onQueryChange(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onSearch();
          }
        }}
        maxLength={200}
        placeholder="e.g. black leather shoes"
        disabled={loading}
        className="w-full rounded-xl border border-slate-300 bg-white px-5 py-4 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />

      <p className="mt-3 text-sm text-slate-500">
        Try: white sneakers, leather handbag, wristwatch
      </p>
    </div>
  );
}

type SearchResultsProps = Readonly<{
  results: Product[];
}>;

function SearchResults({ results }: SearchResultsProps) {
  return (
    <section className="mt-16" aria-live="polite">
      <h3 className="text-3xl font-bold">
        AI Search Results
      </h3>

      <p className="mt-3 text-slate-500">
        Found {results.length} similar products
      </p>

      {results.length === 0 ? (
        <p className="mt-8 text-slate-500">
          No matching products found.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((product, index) => (
            <article
              key={product.filename}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-lg"
            >
              <div className="flex h-56 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${API_URL}/products/${encodeURIComponent(product.filename)}`}
                  alt={product.filename}
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              </div>

              <p className="mt-5 text-sm font-medium text-indigo-600">
                Match #{index + 1}
              </p>

              <h4 className="mt-2 break-words text-lg font-semibold">
                {getProductName(product.filename)}
              </h4>

              <p className="mt-4 text-sm text-slate-500">
                Cosine Similarity
              </p>

              <p className="mt-1 text-2xl font-bold text-indigo-600">
                {product.similarity.toFixed(4)}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const [mode, setMode] = useState<SearchMode>("image");
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  function resetSearch() {
    setResults([]);
    setError("");
    setSearched(false);
  }

  function changeMode(newMode: SearchMode) {
    if (loading) {
      return;
    }

    setMode(newMode);
    resetSearch();
  }

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (
      !["image/jpeg", "image/png"].includes(
        selectedFile.type
      )
    ) {
      setError("Please select a JPG or PNG image.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("Image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
    resetSearch();

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImage(reader.result);
      }
    };

    reader.readAsDataURL(selectedFile);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    resetSearch();
  }

  async function handleSearch() {
    if (loading) {
      return;
    }

    if (mode === "image" && !file) {
      setError("Please upload an image first.");
      return;
    }

    if (mode === "text" && !query.trim()) {
      setError("Please enter a product description.");
      return;
    }

    setLoading(true);
    resetSearch();

    try {
      const searchResults = await performSearch(
        mode,
        file,
        query
      );

      setResults(searchResults);
      setSearched(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <h1 className="text-2xl font-bold text-indigo-600">
            VisionSearch AI
          </h1>

          <p className="text-right text-sm text-slate-500">
            AI-Powered Product Discovery
          </p>
        </div>
      </header>

      {/* Main Section */}
      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
          Powered by CLIP AI
        </span>

        <h2 className="mt-8 text-4xl font-bold tracking-tight md:text-6xl">
          Discover Products{" "}
          <span className="text-indigo-600">
            Visually
          </span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          Search for similar products using an image or a
          natural language description.
        </p>

        {/* Search Card */}
        <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          {/* Search Mode Tabs */}
          <div className="mb-8 grid grid-cols-2 gap-3 rounded-xl bg-slate-100 p-2">
            <button
              type="button"
              onClick={() => changeMode("image")}
              disabled={loading}
              aria-pressed={mode === "image"}
              className={`rounded-lg px-4 py-3 font-semibold transition ${
                mode === "image"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              📷 Search by Image
            </button>

            <button
              type="button"
              onClick={() => changeMode("text")}
              disabled={loading}
              aria-pressed={mode === "text"}
              className={`rounded-lg px-4 py-3 font-semibold transition ${
                mode === "text"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              🔎 Search by Text
            </button>
          </div>

          {/* Search Input */}
          {mode === "image" ? (
            <ImageSearchInput
              image={image}
              loading={loading}
              onChange={handleImageChange}
            />
          ) : (
            <TextSearchInput
              query={query}
              loading={loading}
              onQueryChange={handleQueryChange}
              onSearch={handleSearch}
            />
          )}

          {/* Search Button */}
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="mt-7 w-full rounded-xl bg-indigo-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {getSearchButtonLabel(loading, mode)}
          </button>

          {/* Error Message */}
          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-600"
            >
              {error}
            </p>
          )}
        </div>

        {/* Search Results */}
        {searched && <SearchResults results={results} />}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        VisionSearch AI — Intelligent Product Discovery
      </footer>
    </main>
  );
}
