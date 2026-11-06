
from pathlib import Path
from io import BytesIO

import torch
import torch.nn.functional as F
from PIL import Image, UnidentifiedImageError
from transformers import CLIPModel, CLIPProcessor

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PRODUCTS_FOLDER = PROJECT_ROOT / "data" / "products"

MODEL_NAME = "openai/clip-vit-base-patch32"

model = None
processor = None
product_index = []


def load_search_model():
    global model, processor

    if model is None:
        print("Loading CLIP model...")
        model = CLIPModel.from_pretrained(MODEL_NAME)
        processor = CLIPProcessor.from_pretrained(MODEL_NAME)
        model.eval()

    return model, processor


def get_embedding(image):
    current_model, current_processor = load_search_model()

    inputs = current_processor(
        images=image,
        return_tensors="pt"
    )

    with torch.inference_mode():
        embedding = current_model.get_image_features(**inputs)

    if not isinstance(embedding, torch.Tensor):
        embedding = embedding.pooler_output

    return F.normalize(embedding, p=2, dim=-1)


def build_product_index():
    global product_index

    product_index = []

    if not PRODUCTS_FOLDER.is_dir():
        raise FileNotFoundError("Products folder does not exist.")

    for path in sorted(PRODUCTS_FOLDER.iterdir()):
        if path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
            continue

        try:
            with Image.open(path) as image:
                product_image = image.convert("RGB")

            embedding = get_embedding(product_image)

            product_index.append({
                "filename": path.name,
                "embedding": embedding
            })

        except (UnidentifiedImageError, OSError):
            print(f"Skipping invalid image: {path.name}")

    print(f"Indexed {len(product_index)} products.")


def search_similar_products(image_bytes, top_k=5):
    if not product_index:
        build_product_index()

    if not product_index:
        return []

    with Image.open(BytesIO(image_bytes)) as image:
        query_image = image.convert("RGB")

    query_embedding = get_embedding(query_image)

    results = []

    for product in product_index:
        score = F.cosine_similarity(
            query_embedding,
            product["embedding"],
            dim=-1
        ).item()

        results.append({
            "filename": product["filename"],
            "similarity": round(score, 4)
        })

    results.sort(
        key=lambda item: item["similarity"],
        reverse=True
    )

    return results[:top_k]


def search_products_by_text(query: str, top_k: int = 5):
    """
    Search products using a natural language description.
    """

    if not query.strip():
        raise ValueError("Search query cannot be empty")

    if not product_index:
        build_product_index()

    if not product_index:
        return []

    current_model, current_processor = load_search_model()

    inputs = current_processor(
        text=[query],
        return_tensors="pt",
        padding=True,
        truncation=True
    )

    with torch.inference_mode():
        text_embedding = current_model.get_text_features(**inputs)

    if not isinstance(text_embedding, torch.Tensor):
        text_embedding = text_embedding.pooler_output

    text_embedding = F.normalize(
        text_embedding,
        p=2,
        dim=-1
    )

    results = []

    for product in product_index:
        similarity = F.cosine_similarity(
            text_embedding,
            product["embedding"],
            dim=-1
        ).item()

        results.append({
            "filename": product["filename"],
            "similarity": round(similarity, 4)
        })

    results.sort(
        key=lambda item: item["similarity"],
        reverse=True
    )

    return results[:top_k]

