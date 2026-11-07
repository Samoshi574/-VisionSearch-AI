
import sys
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

import search_service as search


# Test queries with relevant product categories
TEST_CASES = [
    {
        "query": "white sneakers",
        "relevant_category": "shoe"
    },
    {
        "query": "black running shoes",
        "relevant_category": "shoe"
    },
    {
        "query": "leather handbag",
        "relevant_category": "handbag"
    },
    {
        "query": "wristwatch",
        "relevant_category": "watch"
    }
]


def get_category(filename):
    name = filename.lower()

    if "shoe" in name:
        return "shoe"
    elif "handbag" in name or "bag" in name:
        return "handbag"
    elif "watch" in name:
        return "watch"

    return "unknown"


def evaluate():
    print("Loading and indexing products...")

    search.build_product_index()

    filenames = [
        product["filename"]
        for product in search.product_index
    ]

    print(f"Indexed products: {len(filenames)}")

    if not filenames:
        print("No products available.")
        return

    precision_scores = []
    recall_scores = []
    search_times = []

    for case in TEST_CASES:
        query = case["query"]
        category = case["relevant_category"]

        relevant_products = {
            filename
            for filename in filenames
            if get_category(filename) == category
        }

        start = time.perf_counter()

        results = search.search_products_by_text(
            query=query,
            top_k=5
        )

        elapsed = time.perf_counter() - start

        retrieved = {
            item["filename"]
            for item in results
        }

        true_positives = len(
            retrieved & relevant_products
        )

        precision = true_positives / len(results) if results else 0
        recall = (
            true_positives / len(relevant_products)
            if relevant_products else 0
        )

        precision_scores.append(precision)
        recall_scores.append(recall)
        search_times.append(elapsed)

        print(f"\nQuery: {query}")
        print(f"Relevant category: {category}")
        print(f"Precision@5: {precision:.4f}")
        print(f"Recall@5: {recall:.4f}")
        print(f"Search time: {elapsed:.3f} seconds")

    print("\n===== FINAL EVALUATION RESULTS =====")

    print(
        f"Mean Precision@5: "
        f"{sum(precision_scores) / len(precision_scores):.4f}"
    )

    print(
        f"Mean Recall@5: "
        f"{sum(recall_scores) / len(recall_scores):.4f}"
    )

    print(
        f"Average Search Latency: "
        f"{sum(search_times) / len(search_times):.3f} seconds"
    )


if __name__ == "__main__":
    evaluate()

