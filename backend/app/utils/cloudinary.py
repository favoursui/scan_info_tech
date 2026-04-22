"""
app/utils/cloudinary.py
Thin wrapper around the Cloudinary Python SDK.
All credentials are injected from Settings at module load time.
"""
import logging
from typing import BinaryIO
import cloudinary
import cloudinary.uploader
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)

FOLDER = "scan_info_tech/products"


def upload_image(file: BinaryIO, public_id: str | None = None) -> dict:
    """
    Upload a file-like object to Cloudinary.
    Returns the full upload response dict which includes `secure_url` and `public_id`.
    """
    opts: dict = {"folder": FOLDER, "resource_type": "image"}
    if public_id:
        opts["public_id"] = public_id
        opts["overwrite"] = True
    result = cloudinary.uploader.upload(file, **opts)
    logger.info("Cloudinary upload: public_id=%s", result.get("public_id"))
    return result


def replace_image(file: BinaryIO, public_id: str) -> dict:
    """Replace an existing image by overwriting its public_id."""
    return upload_image(file, public_id=public_id)


def delete_image(public_id: str) -> dict:
    """Permanently delete an image from Cloudinary."""
    result = cloudinary.uploader.destroy(public_id, resource_type="image")
    logger.info("Cloudinary delete: public_id=%s result=%s", public_id, result)
    return result
