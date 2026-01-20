import json
from pathlib import Path

from pydantic import BaseModel

from exceptions import NotFoundException


class Reference(BaseModel):
    id: str
    title: str
    description: str | None = None
    modules: list[str] = []
    difficulty: str = "beginner"


class ReferenceContent(BaseModel):
    id: str
    title: str
    content: str
    flashcards: list[dict] = []
    quiz: dict | None = None


class ReferenceVisual(BaseModel):
    name: str
    path: str
    url: str


class ReferencesResponse(BaseModel):
    references: list[Reference]


class ReferenceVisualsResponse(BaseModel):
    visuals: list[ReferenceVisual]


class ReferenceService:
    def __init__(self, content_path: str = "./content/courses"):
        self.content_path = Path(content_path)

    async def list_references(self) -> ReferencesResponse:
        """List all available reference materials."""
        references = []

        if not self.content_path.exists():
            return ReferencesResponse(references=[])

        for course_dir in self.content_path.iterdir():
            if not course_dir.is_dir():
                continue

            meta_path = course_dir / "meta.json"
            if meta_path.exists():
                with open(meta_path) as f:
                    meta = json.load(f)
                    references.append(
                        Reference(
                            id=meta.get("id", course_dir.name),
                            title=meta.get("title", course_dir.name),
                            description=meta.get("description"),
                            modules=meta.get("modules", []),
                            difficulty=meta.get("difficulty", "beginner"),
                        )
                    )
            else:
                references.append(
                    Reference(
                        id=course_dir.name,
                        title=course_dir.name.replace("-", " ").title(),
                        description=None,
                        modules=[],
                        difficulty="beginner",
                    )
                )

        return ReferencesResponse(references=references)

    async def get_reference(self, topic: str, module: str | None = None) -> ReferenceContent:
        """Get rendered reference content for a topic."""
        course_path = self.content_path / topic

        if not course_path.exists():
            raise NotFoundException(f"Reference topic '{topic}' not found")

        meta_path = course_path / "meta.json"
        title = topic.replace("-", " ").title()

        if meta_path.exists():
            with open(meta_path) as f:
                meta = json.load(f)
                title = meta.get("title", title)

        content = ""
        flashcards = []
        quiz = None

        if module:
            module_path = course_path / "modules" / module
            if not module_path.exists():
                raise NotFoundException(f"Module '{module}' not found in '{topic}'")

            content_file = module_path / "content.md"
            if content_file.exists():
                with open(content_file) as f:
                    content = f.read()

            flashcards_file = module_path / "flashcards.json"
            if flashcards_file.exists():
                with open(flashcards_file) as f:
                    data = json.load(f)
                    flashcards = data.get("cards", [])

            quiz_file = module_path / "quiz.json"
            if quiz_file.exists():
                with open(quiz_file) as f:
                    quiz = json.load(f)
        else:
            modules_path = course_path / "modules"
            if modules_path.exists():
                for module_dir in sorted(modules_path.iterdir()):
                    if module_dir.is_dir():
                        content_file = module_dir / "content.md"
                        if content_file.exists():
                            with open(content_file) as f:
                                content += f"\n\n## {module_dir.name}\n\n"
                                content += f.read()

        return ReferenceContent(
            id=topic,
            title=title,
            content=content.strip(),
            flashcards=flashcards,
            quiz=quiz,
        )

    async def get_visuals(self, topic: str, module: str | None = None) -> ReferenceVisualsResponse:
        """Get visual aids for a topic."""
        course_path = self.content_path / topic

        if not course_path.exists():
            raise NotFoundException(f"Reference topic '{topic}' not found")

        visuals = []

        if module:
            visuals_path = course_path / "modules" / module / "visuals"
        else:
            visuals_path = course_path / "visuals"

        if visuals_path.exists():
            for visual_file in visuals_path.iterdir():
                if visual_file.suffix.lower() in [".png", ".jpg", ".jpeg", ".gif", ".svg"]:
                    visuals.append(
                        ReferenceVisual(
                            name=visual_file.stem,
                            path=str(visual_file.relative_to(self.content_path)),
                            url=f"/api/v1/references/{topic}/visuals/{visual_file.name}",
                        )
                    )

        return ReferenceVisualsResponse(visuals=visuals)
