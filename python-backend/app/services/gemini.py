"""Gemini API client for generating automation content.

Mirrors the logic in lib/gemini.ts with retry support.
"""

import httpx
import asyncio
import json
import logging

from app.config import get_settings

logger = logging.getLogger(__name__)


async def generate_content(
    prompt: str,
    max_tokens: int = 3000,
    temperature: float = 0.8,
    top_k: int = 40,
    top_p: float = 0.95,
) -> str:
    """Generate content using Gemini API with retry logic."""
    settings = get_settings()

    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY is not set")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.gemini_api_key}"

    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "topK": top_k,
            "topP": top_p,
            "maxOutputTokens": max_tokens,
        },
    }

    max_retries = 3
    for attempt in range(max_retries + 1):
        try:
            if attempt > 0:
                delay = 2 ** attempt
                logger.warning(f"Gemini retry {attempt}/{max_retries}, waiting {delay}s...")
                await asyncio.sleep(delay)

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    url,
                    json=body,
                    headers={"Content-Type": "application/json"},
                )

                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if not candidates:
                        raise ValueError("No candidates returned from Gemini")

                    text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    if not text:
                        raise ValueError("No text content in Gemini response")

                    return text.strip()

                if response.status_code in (429, 503):
                    continue  # Retry

                raise ValueError(f"Gemini API error {response.status_code}: {response.text}")

        except httpx.HTTPError as e:
            if attempt < max_retries:
                continue
            raise

    raise ValueError("Max retries exceeded for Gemini API")


def parse_json_response(raw: str) -> list[dict]:
    """Parse JSON from Gemini response, handling code fences and repairs."""
    # Remove code fences
    cleaned = raw.replace("```json\n", "").replace("\n```", "").replace("```", "").strip()

    try:
        result = json.loads(cleaned)
        if isinstance(result, list):
            return result
        return [result]
    except json.JSONDecodeError:
        pass

    # Try extracting JSON array
    start = cleaned.find("[")
    end = cleaned.rfind("]")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(cleaned[start : end + 1])
        except json.JSONDecodeError:
            pass

    # Soft repair: try adding closing bracket
    if "[" in cleaned and "]" not in cleaned:
        cleaned = cleaned.rstrip(",") + "]"
        try:
            return json.loads(cleaned[cleaned.find("[") :])
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Failed to parse Gemini response as JSON: {raw[:200]}...")
