"""Ties these tests to the QA catalog (mods/conformance/catalog/areas/voice-sdk.md).

A test marked ``@case("VSD-001")`` gets the case id in its name, so the JUnit results name the case
the release report looks for. Scenario tests take their id from the case that runs their file.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

AREAS = Path(__file__).resolve().parents[3] / "mods" / "conformance" / "catalog" / "areas"

case = pytest.mark.case


def pytest_configure(config):
    config.addinivalue_line("markers", "case(id): the QA catalog case this test proves")


def _case_id(item) -> str | None:
    marker = item.get_closest_marker("case")
    return marker.args[0] if marker and marker.args else None


@pytest.hookimpl(tryfirst=True)  # before -k deselects by keyword
def pytest_collection_modifyitems(items):
    for item in items:
        case_id = _case_id(item)
        if case_id:
            # A keyword, so `pytest -k "VSD and 001"` (the prove script) selects it.
            item.extra_keyword_matches.add(case_id)


@pytest.hookimpl(wrapper=True)
def pytest_runtest_makereport(item, call):
    # The JUnit name comes from the report's nodeid, not the item's (pytest 9 no longer reads
    # item._nodeid), so the id is put on the report: every reader of the XML then sees
    # "test_name [VSD-001]" on 8.x and 9.x (#1187).
    report = yield
    case_id = _case_id(item)
    if case_id:
        report.nodeid = f"{report.nodeid} [{case_id}]"
    return report


def _runs() -> dict[str, str]:
    runs: dict[str, str] = {}
    if not AREAS.is_dir():
        return runs
    for area in sorted(AREAS.glob("*.md")):
        case_id = None
        for line in area.read_text(encoding="utf-8").splitlines():
            heading = re.match(r"^### ([A-Z]{2,4}-\d{3}) ", line)
            if heading:
                case_id = heading.group(1)
            run = re.match(r"^- \*\*Runs:\*\* scenarios/(.+?)\s*$", line)
            if run and case_id:
                for target in re.split(r",\s*", run.group(1)):
                    runs[re.sub(r"\.yaml$", "", target)] = case_id
    return runs


_RUNS = _runs()


def case_for(contract: str, name: str) -> str:
    """The case that runs a scenario file, as "VSD-004 " for a test id, or "" when none does."""
    case_id = _RUNS.get(f"{contract}/{name}") or _RUNS.get(contract)
    return f"{case_id} " if case_id else ""
