"""
Product Condition Analyzer - Integration Module
================================================
Uses YOLOv8 (Ultralytics, free) + Groq API (free tier) for:
- Image-based condition scoring vs original product images
- Depreciation calculation
- Disposal recommendation: resell / refurbish / donate / recycle / exchange

Dependencies:
    pip install ultralytics opencv-python-headless numpy requests pillow groq

Free API Key:
    Groq: https://console.groq.com/  (free tier, no credit card needed)
    Set env var:  GROQ_API_KEY=your_key_here
"""

import os
import io
import json
import base64
import logging
import tempfile
from pathlib import Path
from typing import Optional

import numpy as np
import requests
from PIL import Image

# ---------- optional heavy imports (lazy) ----------
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# 1.  Image utilities
# ─────────────────────────────────────────────────────────────

def _load_image(source) -> Image.Image:
    """Accept file path, URL, bytes, or PIL Image."""
    if isinstance(source, Image.Image):
        return source.convert("RGB")
    if isinstance(source, (bytes, bytearray)):
        return Image.open(io.BytesIO(source)).convert("RGB")
    src = str(source)
    if src.startswith("http://") or src.startswith("https://"):
        resp = requests.get(src, timeout=15)
        resp.raise_for_status()
        return Image.open(io.BytesIO(resp.content)).convert("RGB")
    return Image.open(src).convert("RGB")


def _pil_to_np(img: Image.Image) -> np.ndarray:
    return np.array(img)


def _image_to_base64(img: Image.Image, fmt="JPEG") -> str:
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return base64.b64encode(buf.getvalue()).decode()


# ─────────────────────────────────────────────────────────────
# 2.  Visual similarity scoring  (ResNet-style via YOLO backbone)
# ─────────────────────────────────────────────────────────────

class VisualSimilarityScorer:
    """
    Computes a 0-100 similarity score between an original and a returned image.
    Uses YOLOv8n backbone features (free, runs locally, no API key).
    Falls back to pixel-histogram comparison if Ultralytics is not installed.
    """

    def __init__(self, model_name: str = "yolov8n.pt"):
        self._model = None
        self._model_name = model_name
        if YOLO_AVAILABLE:
            try:
                self._model = YOLO(model_name)  # downloads ~6 MB on first run
                logger.info("YOLOv8 model loaded for feature extraction.")
            except Exception as e:
                logger.warning(f"YOLO load failed ({e}); using histogram fallback.")
        else:
            logger.warning("ultralytics not installed; using histogram fallback.")

    # ------------------------------------------------------------------
    def _extract_features_yolo(self, img: Image.Image) -> np.ndarray:
        """Run YOLO and return flattened feature vector from last backbone layer."""
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
            img.save(f.name)
            tmp_path = f.name
        try:
            results = self._model(tmp_path, verbose=False)
            # Use the raw detection confidence distribution as a compact signature
            if results and results[0].boxes is not None and len(results[0].boxes):
                confs = results[0].boxes.conf.cpu().numpy()
                cls   = results[0].boxes.cls.cpu().numpy()
            else:
                confs = np.array([0.0])
                cls   = np.array([0.0])
            vec = np.concatenate([confs, cls])
            return vec
        finally:
            os.unlink(tmp_path)

    def _histogram_similarity(self, a: Image.Image, b: Image.Image) -> float:
        """Colour-histogram cosine similarity (fallback)."""
        def hist(img):
            img = img.resize((224, 224))
            arr = np.array(img).astype(float)
            h = []
            for c in range(3):
                ch, _ = np.histogram(arr[:, :, c], bins=64, range=(0, 256))
                h.append(ch)
            v = np.concatenate(h).astype(float)
            n = np.linalg.norm(v)
            return v / n if n else v

        ha, hb = hist(a), hist(b)
        cos = float(np.dot(ha, hb))          # both already L2-normalised
        return max(0.0, min(1.0, cos))

    def _structural_diff(self, a: Image.Image, b: Image.Image) -> float:
        """Pixel-level structural similarity proxy (lower = more damage)."""
        size = (224, 224)
        a2 = np.array(a.resize(size)).astype(float)
        b2 = np.array(b.resize(size)).astype(float)
        diff = np.abs(a2 - b2).mean() / 255.0   # 0 = identical, 1 = totally different
        return 1.0 - diff                         # flip → similarity

    # ------------------------------------------------------------------
    def score(self, original: Image.Image, returned: Image.Image) -> float:
        """
        Returns a similarity score in [0, 100].
        100 = identical to original, 0 = completely different / destroyed.
        """
        hist_sim = self._histogram_similarity(original, returned)
        struct_sim = self._structural_diff(original, returned)

        if self._model is not None and YOLO_AVAILABLE:
            try:
                fo = self._extract_features_yolo(original)
                fr = self._extract_features_yolo(returned)
                # pad to same length
                l = max(len(fo), len(fr))
                fo = np.pad(fo, (0, l - len(fo)))
                fr = np.pad(fr, (0, l - len(fr)))
                no, nr = np.linalg.norm(fo), np.linalg.norm(fr)
                if no and nr:
                    yolo_sim = float(np.dot(fo / no, fr / nr))
                    yolo_sim = max(0.0, min(1.0, yolo_sim))
                else:
                    yolo_sim = hist_sim
                raw = 0.4 * yolo_sim + 0.35 * hist_sim + 0.25 * struct_sim
            except Exception as e:
                logger.debug(f"YOLO feature extraction error: {e}")
                raw = 0.6 * hist_sim + 0.4 * struct_sim
        else:
            raw = 0.6 * hist_sim + 0.4 * struct_sim

        return round(raw * 100, 2)


# ─────────────────────────────────────────────────────────────
# 3.  Groq-powered condition analyser (free API)
# ─────────────────────────────────────────────────────────────

GROQ_SYSTEM_PROMPT = """
You are a product condition assessment AI. You receive:
- A product name and its original price.
- A visual similarity score (0-100, where 100 means identical to original).
- Optionally, a description of visible damage provided by the user.

You MUST respond with ONLY valid JSON (no markdown, no explanation) in this exact schema:
{
  "condition_label": "<Like New | Good | Fair | Poor | Damaged>",
  "depreciation_pct": <number 0-100>,
  "new_price": <number>,
  "recommendation": "<resell | refurbish | donate | recycle | exchange>",
  "reason": "<one short sentence>"
}

Rules:
- depreciation_pct is the % of original price lost.
- new_price = original_price * (1 - depreciation_pct/100), rounded to 2 dp.
- Use similarity score + damage description together to decide severity.
- recommendation logic (guide, not rigid):
    resell     → condition Good or Like New  (score ≥ 75)
    refurbish  → condition Fair              (score 50-74)
    donate     → condition Poor but usable   (score 30-49)
    recycle    → condition Damaged / broken  (score < 30)
    exchange   → when product has exchange programme value regardless of condition
"""

class GroqConditionAnalyzer:
    def __init__(self, api_key: Optional[str] = None):
        self._api_key = api_key or os.environ.get("GROQ_API_KEY", "")
        self._client = None
        if self._api_key and GROQ_AVAILABLE:
            self._client = Groq(api_key=self._api_key)
        elif not self._api_key:
            logger.warning("GROQ_API_KEY not set. Will use rule-based fallback.")

    def analyze(
        self,
        product_name: str,
        original_price: float,
        similarity_score: float,
        damage_description: str = "",
    ) -> dict:
        payload = {
            "product_name": product_name,
            "original_price": original_price,
            "similarity_score": similarity_score,
            "damage_description": damage_description or "No additional description provided.",
        }

        if self._client:
            try:
                response = self._client.chat.completions.create(
                    model="llama3-8b-8192",   # free on Groq
                    messages=[
                        {"role": "system", "content": GROQ_SYSTEM_PROMPT},
                        {"role": "user",   "content": json.dumps(payload)},
                    ],
                    temperature=0.2,
                    max_tokens=300,
                )
                raw = response.choices[0].message.content.strip()
                return json.loads(raw)
            except Exception as e:
                logger.warning(f"Groq API error ({e}); using rule-based fallback.")

        return self._rule_based(original_price, similarity_score)

    @staticmethod
    def _rule_based(original_price: float, score: float) -> dict:
        """Deterministic fallback when Groq is unavailable."""
        if score >= 90:
            label, dep, rec = "Like New", 5,  "resell"
        elif score >= 75:
            label, dep, rec = "Good",     20, "resell"
        elif score >= 55:
            label, dep, rec = "Fair",     45, "refurbish"
        elif score >= 35:
            label, dep, rec = "Poor",     65, "donate"
        else:
            label, dep, rec = "Damaged",  90, "recycle"

        new_price = round(original_price * (1 - dep / 100), 2)
        return {
            "condition_label": label,
            "depreciation_pct": dep,
            "new_price": new_price,
            "recommendation": rec,
            "reason": "Rule-based assessment (Groq API not available).",
        }


# ─────────────────────────────────────────────────────────────
# 4.  Main public API
# ─────────────────────────────────────────────────────────────

class ProductConditionAnalyzer:
    """
    High-level class to integrate into your existing project.

    Usage
    -----
    analyzer = ProductConditionAnalyzer(groq_api_key="gsk_...")

    result = analyzer.analyze(
        product={"title": "Apple iPhone 14", "price": 799},
        original_images=["https://cdn.dummyjson.com/product-images/1/1.jpg"],
        returned_images=["path/to/user_photo.jpg"],
        damage_description="Screen has a crack on the left side",
    )
    print(result)
    """

    def __init__(self, groq_api_key: Optional[str] = None, yolo_model: str = "yolov8n.pt"):
        self._scorer   = VisualSimilarityScorer(model_name=yolo_model)
        self._analyzer = GroqConditionAnalyzer(api_key=groq_api_key)

    # ------------------------------------------------------------------
    def analyze(
        self,
        product: dict,
        original_images: list,
        returned_images: list,
        damage_description: str = "",
    ) -> dict:
        """
        Parameters
        ----------
        product          : dict with at least {"title": str, "price": float}
                           (compatible with dummyjson.com/products format)
        original_images  : list of image sources (paths / URLs / PIL Images / bytes)
        returned_images  : list of image sources uploaded by the user
        damage_description: optional free-text damage note from user

        Returns
        -------
        dict with keys:
            product_id, product_title, original_price,
            similarity_score, condition_label, depreciation_pct,
            new_price, recommendation, reason
        """
        if not original_images or not returned_images:
            raise ValueError("Both original_images and returned_images must be non-empty.")

        # ── load images ──────────────────────────────────────────────
        orig_imgs = [_load_image(s) for s in original_images]
        ret_imgs  = [_load_image(s) for s in returned_images]

        # ── compute pairwise similarities, take average ──────────────
        scores = []
        for oi in orig_imgs:
            for ri in ret_imgs:
                scores.append(self._scorer.score(oi, ri))

        similarity_score = round(float(np.mean(scores)), 2)
        logger.info(f"Similarity score: {similarity_score}/100  (from {len(scores)} pair(s))")

        # ── ask Groq (or fallback) ───────────────────────────────────
        name  = product.get("title", product.get("name", "Unknown Product"))
        price = float(product.get("price", 0))

        assessment = self._analyzer.analyze(
            product_name=name,
            original_price=price,
            similarity_score=similarity_score,
            damage_description=damage_description,
        )

        return {
            "product_id":        product.get("id"),
            "product_title":     name,
            "original_price":    price,
            "similarity_score":  similarity_score,
            **assessment,           # condition_label, depreciation_pct, new_price, recommendation, reason
        }

    # ------------------------------------------------------------------
    def analyze_batch(self, items: list) -> list:
        """
        Process multiple return/listing items at once.

        Each element of `items` is a dict:
        {
          "product": {...},
          "original_images": [...],
          "returned_images": [...],
          "damage_description": "..."   # optional
        }
        """
        results = []
        for item in items:
            try:
                r = self.analyze(
                    product=item["product"],
                    original_images=item["original_images"],
                    returned_images=item["returned_images"],
                    damage_description=item.get("damage_description", ""),
                )
            except Exception as e:
                r = {"error": str(e), "product": item.get("product", {})}
            results.append(r)
        return results


# ─────────────────────────────────────────────────────────────
# 5.  Demo / quick-test  (run: python product_condition_analyzer.py)
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import asyncio, pprint

    async def demo():
        # 1. Fetch a product from dummyjson (same as your project)
        resp = requests.get("https://dummyjson.com/products/1", timeout=10)
        product = resp.json()
        print(f"\nProduct: {product['title']}  |  Price: ${product['price']}")

        # 2. Use the first product thumbnail as "original"
        original_images = product["images"][:1]    # e.g. CDN URL

        # 3. Simulate a "returned" image — here we reuse the same image with
        #    an artificial colour-shift to mimic wear.  In production, the user
        #    uploads their actual photos.
        orig_pil = _load_image(original_images[0])
        worn_arr = np.array(orig_pil).astype(float)
        # darken + add noise to simulate wear
        worn_arr = np.clip(worn_arr * 0.65 + np.random.normal(0, 15, worn_arr.shape), 0, 255).astype(np.uint8)
        worn_pil = Image.fromarray(worn_arr)

        # 4. Run analyzer (set GROQ_API_KEY env var for AI reasoning)
        analyzer = ProductConditionAnalyzer(
            groq_api_key=os.environ.get("GROQ_API_KEY"),
        )
        result = analyzer.analyze(
            product=product,
            original_images=[orig_pil],
            returned_images=[worn_pil],
            damage_description="Item shows visible fading and minor scratches on surface.",
        )

        print("\n── Assessment Result ──────────────────────────────────")
        pprint.pprint(result)

    asyncio.run(demo())
