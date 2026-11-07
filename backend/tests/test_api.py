
import sys
from pathlib import Path
from io import BytesIO
from unittest.mock import patch

from fastapi.testclient import TestClient
from PIL import Image

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from main import app

client = TestClient(app)


def create_test_image():
    image = Image.new("RGB", (100, 100), "white")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def test_homepage():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["status"] == (
        "Backend is running successfully"
    )


def test_valid_image_upload():
    response = client.post(
        "/upload-image",
        files={
            "file": (
                "test.png",
                create_test_image(),
                "image/png",
            )
        },
    )

    assert response.status_code == 200
    assert response.json()["format"] == "PNG"


def test_invalid_image_upload():
    response = client.post(
        "/upload-image",
        files={
            "file": (
                "invalid.txt",
                b"This is not an image",
                "text/plain",
            )
        },
    )

    assert response.status_code == 400


def test_text_search():
    mock_results = [
        {
            "filename": "white_shoe.jpg",
            "similarity": 0.85,
        }
    ]

    with patch(
        "main.search_products_by_text",
        return_value=mock_results,
    ):
        response = client.post(
            "/search-text",
            json={"query": "white sneakers"},
        )

    assert response.status_code == 200
    assert response.json()["total_results"] == 1
    assert response.json()["results"] == mock_results


def test_empty_text_search():
    response = client.post(
        "/search-text",
        json={"query": "   "},
    )

    assert response.status_code == 400
