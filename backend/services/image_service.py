"""Image service - handles image uploads, downloads, and markdown rewriting."""

import re
import aiohttp
import aiofiles
from pathlib import Path
from uuid import uuid4
from urllib.parse import urlparse

from exceptions import ErrorCode, StudyBuddyException


# Supported image formats
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB


class ImageService:
    """Handles image upload, download from URLs, and markdown rewriting."""

    def __init__(self, uploads_path: str = "./uploads"):
        self.uploads_path = Path(uploads_path)
        self.uploads_path.mkdir(parents=True, exist_ok=True)

    def get_course_images_path(self, course_id: str) -> Path:
        """Get the images directory for a course."""
        images_path = self.uploads_path / "courses" / course_id / "images"
        images_path.mkdir(parents=True, exist_ok=True)
        return images_path

    async def upload_image(
        self, file_content: bytes, filename: str, course_id: str
    ) -> str:
        """Upload an image file and return the local URL.

        Args:
            file_content: Image bytes
            filename: Original filename
            course_id: Course ID for organizing uploads

        Returns:
            Local URL path for the image

        Raises:
            StudyBuddyException: If file format is invalid or too large
        """
        # Validate extension
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise StudyBuddyException(
                f"Invalid image format. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
                status_code=400,
                code=ErrorCode.INVALID_IMAGE_FORMAT,
            )

        # Validate size
        if len(file_content) > MAX_IMAGE_SIZE:
            raise StudyBuddyException(
                f"Image too large. Maximum size: {MAX_IMAGE_SIZE // 1024 // 1024}MB",
                status_code=400,
                code=ErrorCode.VALIDATION_ERROR,
            )

        # Generate unique filename
        unique_filename = f"{uuid4()}{ext}"
        images_path = self.get_course_images_path(course_id)
        file_path = images_path / unique_filename

        # Write file
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(file_content)

        # Return local URL
        return f"/api/v1/uploads/courses/{course_id}/images/{unique_filename}"

    async def download_external_image(self, url: str, course_id: str) -> str:
        """Download an external image and return the local URL.

        Args:
            url: External image URL
            course_id: Course ID for organizing uploads

        Returns:
            Local URL path for the downloaded image

        Raises:
            StudyBuddyException: If download fails or format is invalid
        """
        # Validate URL
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            raise StudyBuddyException(
                "Invalid URL scheme. Only HTTP and HTTPS are supported.",
                status_code=400,
                code=ErrorCode.VALIDATION_ERROR,
            )

        # Determine extension from URL
        url_path = Path(parsed.path)
        ext = url_path.suffix.lower()

        # Default to .jpg if no extension or invalid
        if ext not in ALLOWED_EXTENSIONS:
            ext = ".jpg"

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as response:
                    if response.status != 200:
                        raise StudyBuddyException(
                            f"Failed to download image: HTTP {response.status}",
                            status_code=400,
                            code=ErrorCode.IMAGE_DOWNLOAD_FAILED,
                        )

                    # Check content type
                    content_type = response.headers.get("content-type", "")
                    if content_type.startswith("image/"):
                        # Try to determine extension from content type
                        type_ext_map = {
                            "image/png": ".png",
                            "image/jpeg": ".jpg",
                            "image/gif": ".gif",
                            "image/svg+xml": ".svg",
                            "image/webp": ".webp",
                        }
                        for ct, e in type_ext_map.items():
                            if ct in content_type:
                                ext = e
                                break

                    # Check size
                    content_length = response.headers.get("content-length")
                    if content_length and int(content_length) > MAX_IMAGE_SIZE:
                        raise StudyBuddyException(
                            f"Image too large. Maximum size: {MAX_IMAGE_SIZE // 1024 // 1024}MB",
                            status_code=400,
                            code=ErrorCode.VALIDATION_ERROR,
                        )

                    # Read content
                    content = await response.read()

                    # Double-check size
                    if len(content) > MAX_IMAGE_SIZE:
                        raise StudyBuddyException(
                            f"Image too large. Maximum size: {MAX_IMAGE_SIZE // 1024 // 1024}MB",
                            status_code=400,
                            code=ErrorCode.VALIDATION_ERROR,
                        )

        except aiohttp.ClientError as e:
            raise StudyBuddyException(
                f"Failed to download image: {str(e)}",
                status_code=400,
                code=ErrorCode.IMAGE_DOWNLOAD_FAILED,
            )

        # Generate unique filename
        unique_filename = f"{uuid4()}{ext}"
        images_path = self.get_course_images_path(course_id)
        file_path = images_path / unique_filename

        # Write file
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)

        # Return local URL
        return f"/api/v1/uploads/courses/{course_id}/images/{unique_filename}"

    async def process_markdown(self, content: str, course_id: str) -> str:
        """Process markdown content, downloading external images and rewriting references.

        Args:
            content: Markdown content with image references
            course_id: Course ID for organizing uploads

        Returns:
            Markdown content with external images replaced by local URLs
        """
        # Regex to find markdown images: ![alt](url)
        image_pattern = r"!\[([^\]]*)\]\(([^)]+)\)"

        async def replace_image(match) -> str:
            alt_text = match.group(1)
            url = match.group(2)

            # Skip if already a local URL
            if url.startswith("/api/") or url.startswith("visuals/"):
                return match.group(0)

            # Skip if it's a relative path (not an external URL)
            parsed = urlparse(url)
            if not parsed.scheme:
                return match.group(0)

            try:
                local_url = await self.download_external_image(url, course_id)
                return f"![{alt_text}]({local_url})"
            except StudyBuddyException:
                # If download fails, keep original URL
                return match.group(0)

        # Process all image references
        # Note: We can't use re.sub with async, so we need to do it manually
        result = []
        last_end = 0

        for match in re.finditer(image_pattern, content):
            result.append(content[last_end : match.start()])
            replacement = await replace_image(match)
            result.append(replacement)
            last_end = match.end()

        result.append(content[last_end:])
        return "".join(result)

    def get_image_path(self, course_id: str, filename: str) -> Path | None:
        """Get the full path to an uploaded image.

        Args:
            course_id: Course ID
            filename: Image filename

        Returns:
            Path to the image file, or None if not found
        """
        # Validate filename (security: prevent path traversal)
        if "/" in filename or "\\" in filename or ".." in filename:
            return None

        images_path = self.uploads_path / "courses" / course_id / "images"
        file_path = images_path / filename

        if file_path.exists():
            return file_path

        return None

    async def delete_course_images(self, course_id: str) -> None:
        """Delete all images for a course.

        Args:
            course_id: Course ID
        """
        images_path = self.uploads_path / "courses" / course_id

        if images_path.exists():
            import shutil
            shutil.rmtree(images_path)
