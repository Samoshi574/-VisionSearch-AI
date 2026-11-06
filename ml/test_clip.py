
import torch
from transformers import CLIPModel, CLIPProcessor
from PIL import Image
from pathlib import Path

# Load pretrained CLIP model
model_name = "openai/clip-vit-base-patch32"

print("Loading CLIP AI model...")

model = CLIPModel.from_pretrained(model_name)
processor = CLIPProcessor.from_pretrained(model_name)

model.eval()

# Image location
project_root = Path(__file__).resolve().parent.parent
image_path = project_root / "data" / "test_shoe.png"

# Open image
image = Image.open(image_path).convert("RGB")

# Possible descriptions
labels = [
    "a photo of a shoe",
    "a photo of a handbag",
    "a photo of a wristwatch",
    "a photo of a shirt"
]

# Prepare image and text
inputs = processor(
    text=labels,
    images=image,
    return_tensors="pt",
    padding=True
)

# Get AI predictions
with torch.no_grad():
    outputs = model(**inputs)

    probabilities = outputs.logits_per_image.softmax(dim=1)[0]

# Display results
print("\nAI Prediction Results:")

for label, probability in zip(labels, probabilities):
    print(f"{label}: {probability.item() * 100:.2f}%")

best_index = probabilities.argmax().item()

print("\nFinal Prediction:", labels[best_index])
