
from io import BytesIO

from fastapi import FastAPI, File, UploadFile, HTTPException
from PIL import Image, UnidentifiedImageError

from search_service import (
    search_similar_products,
    search_products_by_text
)
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="VisionSearch AI API",
    description="AI-powered product image similarity search using CLIP",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
PROJECT_ROOT = Path(__file__).resolve().parent.parent

PRODUCTS_FOLDER = PROJECT_ROOT / "data" / "products"

app.mount(
    "/products",
    StaticFiles(directory=str(PRODUCTS_FOLDER)),
    name="products"
)

MAX_FILE_SIZE = 5 * 1024 * 1024
ALLOWED_FORMATS = {"JPEG", "PNG"}


# API 1 - Home
@app.get("/")
def home():
    return {
        "message": "Welcome to VisionSearch AI",
        "status": "Backend is running successfully"
    }


# Helper - Validate uploaded images
async def validate_image(file: UploadFile):

    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(
            status_code=400,
            detail="Only JPG and PNG images are allowed"
        )

    contents = await file.read(MAX_FILE_SIZE + 1)

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Image must be 5 MB or smaller"
        )

    try:
        image = Image.open(BytesIO(contents))
        image.verify()

        image = Image.open(BytesIO(contents))

        if image.format not in ALLOWED_FORMATS:
            raise ValueError("Unsupported image format")

        image_info = {
            "filename": file.filename,
            "format": image.format,
            "width": image.width,
            "height": image.height
        }

        image.close()

        return contents, image_info

    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        Image.DecompressionBombError
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid image file"
        )


# API 2 - Upload Image
@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):

    contents, image_info = await validate_image(file)

    return {
        "message": "Image uploaded successfully",
        **image_info
    }


# API 3 - Search Similar Products
@app.post("/search-image")
async def search_image(file: UploadFile = File(...)):

    contents, image_info = await validate_image(file)

    try:
        results = search_similar_products(
            image_bytes=contents,
            top_k=5
        )

        return {
            "message": "AI image search completed",
            "query_image": image_info["filename"],
            "total_results": len(results),
            "results": results
        }

    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Unable to process image"
        )


from pydantic import BaseModel, Field


class TextSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=200)


@app.post("/search-text")
def search_text(request: TextSearchRequest):

    if not request.query.strip():
        raise HTTPException(
            status_code=400,
            detail="Search query cannot be empty"
        )

    results = search_products_by_text(
        query=request.query,
        top_k=5
    )

    return {
        "message": "AI text search completed",
        "query": request.query,
        "total_results": len(results),
        "results": results
    }

