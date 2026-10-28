"""The case id reaches JUnit.

mods/conformance/catalog/prove.cjs and report.cjs read a case's id from the JUnit testcase's
``name`` attribute (``<test> [VSD-003]``), and only a failing testcase carrying the id proves a
case. This runs a real pytest, as the prove script does, on a throwaway test file with this
folder's conftest.py and checks the XML it writes, under whatever pytest is installed (#1187).
"""

from __future__ import annotations

import subprocess
import sys
import textwrap
import xml.etree.ElementTree as ET
from pathlib import Path

CONFTEST = Path(__file__).with_name("conftest.py")

MARKED = '''
import pytest
from conftest import case


@case("VSD-999")
def test_marked_fails():
    assert False


@pytest.mark.parametrize("name", ["VSD-998 scenario"])
def test_scenario(name):
    assert name
'''


def _run(tmp_path: Path, *args: str) -> dict[str, bool]:
    """Runs pytest with --junitxml in tmp_path; returns each testcase name and whether it failed."""
    (tmp_path / "conftest.py").write_text(CONFTEST.read_text(encoding="utf-8"), encoding="utf-8")
    (tmp_path / "test_marked.py").write_text(textwrap.dedent(MARKED), encoding="utf-8")
    junit = tmp_path / "junit.xml"
    subprocess.run(
        [
            sys.executable,
            "-m",
            "pytest",
            "-q",
            "-p",
            "no:cacheprovider",
            "--rootdir",
            str(tmp_path),
            f"--junitxml={junit}",
            *args,
            "test_marked.py",
        ],
        cwd=tmp_path,
        check=False,
        capture_output=True,
        text=True,
    )
    return {
        testcase.get("name"): testcase.find("failure") is not None
        for testcase in ET.parse(junit).getroot().iter("testcase")
    }


def test_a_failing_marked_test_carries_its_case_id_in_junit(tmp_path: Path):
    cases = _run(tmp_path)
    assert [name for name, failed in cases.items() if failed] == ["test_marked_fails [VSD-999]"]
    # A parametrized id keeps its own case id, untouched.
    assert "test_scenario[VSD-998 scenario]" in cases


def test_k_selects_the_marked_test_by_its_case_id(tmp_path: Path):
    # The prove script selects a case as `-k "VSD and 999"` (pytest -k can't take a hyphen).
    cases = _run(tmp_path, "-k", "VSD and 999")
    assert list(cases) == ["test_marked_fails [VSD-999]"]
