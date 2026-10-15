"""Loads and validates fonoster.scenario.v1 files (see mods/conformance/SCENARIOS.md).

The scenario files and the schema ship with the @fonoster/conformance npm package. Runners must
not keep private copies: point FONOSTER_CONFORMANCE_DIR at the package (or this repository's
mods/conformance) of the same version.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import jsonschema
import yaml


def conformance_dir() -> Path:
    env = os.environ.get("FONOSTER_CONFORMANCE_DIR")
    if env:
        return Path(env)
    # In this repository: python/fonoster-conformance/src/fonoster_conformance -> mods/conformance
    return Path(__file__).resolve().parents[4] / "mods" / "conformance"


def _schema() -> dict[str, Any]:
    return json.loads((conformance_dir() / "schema" / "scenario.schema.json").read_text())


class ScenarioError(Exception):
    pass


def load_scenario(path: Path) -> dict[str, Any]:
    data = yaml.safe_load(path.read_text())
    try:
        jsonschema.validate(data, _schema())
    except jsonschema.ValidationError as e:
        raise ScenarioError(f"invalid scenario {path}: {e.message}") from e
    if data["name"] != path.stem:
        raise ScenarioError(f"{path}: name {data['name']!r} does not match the file name")
    data["file"] = str(path)
    return data


def load_scenarios(contract: str) -> list[dict[str, Any]]:
    folder = conformance_dir() / "scenarios" / contract
    return [load_scenario(p) for p in sorted(folder.glob("*.yaml"))]
