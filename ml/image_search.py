
from pathlib import Path

import torch
import torch.nn.functional as F
from PIL import Image
from transformers import CLIPModel, CLIPProcessor


# 1. Project paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
QUERY_IMAGE = PROJECT_ROOT / "data" / "test_shoe.png"
PRODUCTS_FOLDER = PROJECT_ROOT / "data" / "products"


# 2. Load CLIP model
print("Loading CLIP AI model...")

model_name = "openai/clip-vit-base-patch32"
model = CLIPModel.from_pretrained(model_name)
processor = CLIPProcessor.from_pretrained(model_name)

model.eval()


# 3. Function to convert an image into an embedding
def get_image_embedding(image):
    inputs = processor(
        images=image,
        return_tensors="pt",
    )

    with torch.inference_mode():
        embedding = model.get_image_features(**inputs)

    if not isinstance(embedding, torch.Tensor):
        embedding = embedding.pooler_output

    return F.normalize(embedding, p=2, dim=-1)


# 4. Check query image and product folder
if not QUERY_IMAGE.is_file():
    raise FileNotFoundError(
        f"Query image not found: {QUERY_IMAGE}"
    )

if not PRODUCTS_FOLDER.is_dir():
    raise FileNotFoundError(
        f"Products folder not found: {PRODUCTS_FOLDER}"
    )


# 5. Extract query image features
with Image.open(QUERY_IMAGE) as img:
    query_image = img.convert("RGB")

query_embedding = get_image_embedding(query_image)


# 6. Compare query image with all products
results = []

supported_formats = {".jpg", ".jpeg", ".png"}

for image_path in sorted(PRODUCTS_FOLDER.iterdir()):
    if image_path.suffix.lower() not in supported_formats:
        continue

    try:
        with Image.open(image_path) as img:
            product_image = img.convert("RGB")

        product_embedding = get_image_embedding(product_image)

        similarity = F.cosine_similarity(
            query_embedding,
            product_embedding,
            dim=-1,
        ).item()

        results.append({
            "filename": image_path.name,
            "similarity": similarity,
        })

    except OSError as error:
        print(f"Skipping {image_path.name}: {error}")


# 7. Sort by similarity
results.sort(
    key=lambda item: item["similarity"],
    reverse=True,
)


# 8. Display top 5 results
print("\nTop 5 Similar Products:\n")

if not results:
    print("No valid product images found.")

for rank, product in enumerate(results[:5], start=1):
    print(
        f"{rank}. {product['filename']} "
        f"- Similarity: {product['similarity']:.4f}"
    )

print("\nImage similarity search completed!")
