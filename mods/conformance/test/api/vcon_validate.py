"""Validates vCon files with vcon-lib 0.10.0, the vCon authors' reference library (API-073).

Usage: python -I vcon_validate.py <file.json>...
Prints one JSON array to stdout: {"file", "valid", "errors"} per file, in the order given.
vcon-lib's own log lines are silenced so stdout holds only the result.
"""

from __future__ import annotations

import json
import logging
import sys
import warnings

warnings.simplefilter("ignore")
logging.disable(logging.CRITICAL)

from vcon import Vcon  # noqa: E402


def main(files: list[str]) -> None:
    results = []
    for file in files:
        valid, errors = Vcon.validate_file(file)
        results.append({"file": file, "valid": valid, "errors": errors})
    sys.stdout.write(json.dumps(results))


if __name__ == "__main__":
    main(sys.argv[1:])
