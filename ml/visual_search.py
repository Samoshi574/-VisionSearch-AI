
import subprocess
import sys
import re
import html
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "ml" / "image_search.py"
PRODUCTS = ROOT / "data" / "products"
OUTPUT = ROOT / "visual_results.html"

# Run similarity search
result = subprocess.run(
    [sys.executable, str(SCRIPT)],
    capture_output=True,
    text=True,
    check=True
)

# Read matching product results
pattern = r"^\d+\.\s+(.+?)\s+- Similarity:\s+(-?\d+\.\d+)$"
matches = re.findall(pattern, result.stdout, re.MULTILINE)

cards = []

for filename, score in matches:
    image_path = PRODUCTS / filename

    if not image_path.is_file():
        continue

    image_url = image_path.resolve().as_uri()

    cards.append(f"""
    <div class="card">
        <img src="{html.escape(image_url, quote=True)}">
        <h3>{html.escape(filename)}</h3>
        <p>Similarity: {float(score):.4f}</p>
    </div>
    """)

page = """
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>VisionSearch AI Results</title>
<style>
body {
    font-family: Arial, sans-serif;
    background: #f5f7fb;
    padding: 40px;
    text-align: center;
}
h1 { color: #1e293b; }
.grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
    margin-top: 30px;
}
.card {
    width: 210px;
    padding: 15px;
    background: white;
    border-radius: 14px;
    box-shadow: 0 4px 15px #0001;
}
img {
    width: 100%;
    height: 170px;
    object-fit: contain;
}
p { color: #2563eb; font-weight: bold; }
</style>
</head>
<body>
<h1>VisionSearch AI</h1>
<h2>Top 5 Similar Products</h2>
<div class="grid">
""" + "\n".join(cards) + """
</div>
</body>
</html>
"""

OUTPUT.write_text(page, encoding="utf-8")

print(f"Results saved to: {OUTPUT}")
