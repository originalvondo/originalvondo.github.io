from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

SUPPORTED_EXTENSIONS = {".mp3", ".wav", ".flac", ".m4a", ".ogg", ".aac", ".opus"}


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def choose_existing_key(folder_name: str, data: Dict[str, List[str]]) -> str:
    if folder_name in data:
        return folder_name

    normalized_target = slugify(folder_name)
    for existing_key in data.keys():
        if slugify(existing_key) == normalized_target:
            return existing_key

    return folder_name


def find_audio_files(music_dir: Path) -> List[Tuple[str, Path]]:
    audio_files: List[Tuple[str, Path]] = []

    for path in music_dir.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue

        relative_to_music = path.relative_to(music_dir)
        if len(relative_to_music.parts) < 2:
            continue

        folder_name = relative_to_music.parts[0]
        audio_files.append((folder_name, path))

    return sorted(audio_files, key=lambda item: (item[0].lower(), item[1].as_posix()))


def update_music_json(repo_root: Path) -> int:
    music_dir = repo_root / "media" / "music"
    music_json_path = music_dir / "music.json"

    if music_json_path.exists():
        with music_json_path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
    else:
        data = {}

    if not isinstance(data, dict):
        raise ValueError("music.json must contain a JSON object at the top level")

    added_count = 0
    for folder_name, file_path in find_audio_files(music_dir):
        key = choose_existing_key(folder_name, data)
        if key not in data:
            data[key] = []

        relative_path = file_path.relative_to(repo_root).as_posix()
        if relative_path not in data[key]:
            data[key].append(relative_path)
            added_count += 1

    with music_json_path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2)
        handle.write("\n")

    return added_count


if __name__ == "__main__":
    repo_root = Path(__file__).resolve().parent
    added_count = update_music_json(repo_root)
    if added_count:
        print(f"Added {added_count} new song path(s) to media/music/music.json")
    else:
        print("No new songs found; media/music/music.json is up to date")
