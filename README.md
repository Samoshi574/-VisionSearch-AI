
# VisionSearch AI

### AI-Powered Visual Product Search Platform

VisionSearch AI is a full-stack AI-powered web application that allows users to discover visually similar products by uploading an image.

The system uses a pretrained CLIP model to generate image embeddings and cosine similarity to rank matching products.

## Features

- Product image upload (JPG and PNG)
- AI-powered image similarity search
- CLIP image embedding generation
- Cosine similarity ranking
- Top 5 matching product recommendations
- Product images and similarity scores
- Responsive web interface
- REST API integration
- Image validation and file size restrictions

## Technology Stack

**Frontend**
- Next.js
- React
- TypeScript
- Tailwind CSS

**Backend**
- Python
- FastAPI
- Pillow

**Artificial Intelligence**
- PyTorch
- Hugging Face Transformers
- OpenAI CLIP ViT-B/32
- Cosine Similarity

**Development Tools**
- VS Code
- Git
- GitHub

## System Architecture

```text
User
 |
 v
Next.js Frontend
 |
 | Upload Image
 v
FastAPI Backend
 |
 v
CLIP Image Encoder
 |
 v
Image Embedding
 |
 v
Cosine Similarity Search
 |
 v
Top 5 Similar Products
 |
 v
Frontend Results Display
```

## Project Structure

```text
VisionSearch-AI/
├── backend/
│   ├── main.py
│   └── search_service.py
├── frontend/
│   ├── src/
│   │   └── app/
│   │       └── page.tsx
│   └── package.json
├── ml/
│   ├── test_clip.py
│   ├── image_search.py
│   └── visual_search.py
├── data/
│   └── products/
├── .gitignore
└── README.md
```

## How It Works

1. The user uploads a product image.
2. FastAPI validates and processes the uploaded image.
3. The pretrained CLIP model generates an image embedding.
4. The embedding is compared with indexed product embeddings.
5. Cosine similarity scores are calculated.
6. The top five most similar products are returned.
7. The frontend displays product images and similarity scores.

## Running the Project Locally

### Backend

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install fastapi "uvicorn[standard]" python-multipart pillow torch transformers
python -m uvicorn main:app --reload
```

Backend API: http://127.0.0.1:8000/docs

### Frontend

Open a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Backend health check |
| POST | `/upload-image` | Validate uploaded image |
| POST | `/search-image` | Search for similar products |
| GET | `/products/{filename}` | Serve product images |

## Dataset

The current MVP uses a small local collection of sample product images.

Product images are excluded from GitHub using `.gitignore`. To run the similarity search, add JPG or PNG images to `data/products/` before starting the backend.

The initial prototype uses five sample product images covering shoes, handbags, and watches.

## Current Limitations

- Small product catalog
- No persistent vector database
- Image-based search only
- Local development configuration
- No formal retrieval benchmark yet

## Future Improvements

- Larger product dataset
- Text-to-image product search
- FAISS or pgvector indexing
- Product category filtering
- Model performance evaluation
- Docker deployment
- User authentication

## Project Status

Working full-stack MVP with CLIP-powered visual similarity search.

## Author

GitHub: [Samoshi574](https://github.com/Samoshi574)
