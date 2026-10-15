"""Pattern matching, as defined in SCENARIOS.md ("Matching"). Mirrors src/scenario/match.ts."""

from __future__ import annotations

import json
import re
from typing import Any

_MISSING = object()


def _show(v: Any) -> str:
    s = json.dumps(v) if v is not _MISSING else "undefined"
    return s if len(s) <= 120 else s[:117] + "..."


def _is_operator(p: Any) -> bool:
    return isinstance(p, dict) and len(p) > 0 and all(k.startswith("$") for k in p)


def _is_number(v: Any) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _fail(path: str, reason: str) -> str:
    return f"{path or '<root>'}: {reason}"


def _operator(op: dict[str, Any], value: Any, path: str) -> str | None:
    present = value is not _MISSING
    if "$absent" in op:
        want_absent = op["$absent"] is True
        if want_absent == (not present):
            return None
        return _fail(path, f"expected absent, got {_show(value)}" if want_absent else "expected present")
    if not present:
        return _fail(path, "missing")
    if "$near" in op:
        target, tol = float(op["$near"]), float(op.get("$tolerance", 0))
        if _is_number(value) and abs(value - target) <= tol:
            return None
        return _fail(path, f"expected {target} ± {tol}, got {_show(value)}")
    if len(op) != 1:
        return _fail(path, f"operator object must have one key, got {', '.join(op)}")
    (key, arg), = op.items()
    if key == "$eq":
        return None if value == arg else _fail(path, f"expected {_show(arg)}, got {_show(value)}")
    if key in ("$gte", "$lte", "$gt", "$lt"):
        if not _is_number(value):
            return _fail(path, f"expected a number, got {_show(value)}")
        n = float(arg)
        ok = {"$gte": value >= n, "$lte": value <= n, "$gt": value > n, "$lt": value < n}[key]
        return None if ok else _fail(path, f"expected {key[1:]} {arg}, got {value}")
    if key == "$contains":
        ok = isinstance(value, str) and str(arg) in value
        return None if ok else _fail(path, f"expected a string containing {_show(arg)}, got {_show(value)}")
    if key == "$re":
        ok = isinstance(value, str) and re.search(str(arg), value) is not None
        return None if ok else _fail(path, f"expected a string matching /{arg}/, got {_show(value)}")
    if key == "$oneOf":
        reasons = []
        for alt in arg:
            r = _match(alt, value, path)
            if r is None:
                return None
            reasons.append(r)
        return _fail(path, f"no alternative matched ({'; '.join(reasons)})")
    if key == "$includes":
        if not isinstance(value, list):
            return _fail(path, f"expected a list, got {_show(value)}")
        for i, want in enumerate(arg):
            if not any(_match(want, el, f"{path}[{j}]") is None for j, el in enumerate(value)):
                return _fail(path, f"no element matches $includes[{i}] {_show(want)}")
        return None
    if key == "$excludes":
        if not isinstance(value, list):
            return _fail(path, f"expected a list, got {_show(value)}")
        for i, unwanted in enumerate(arg):
            for j, el in enumerate(value):
                if _match(unwanted, el, f"{path}[{j}]") is None:
                    return _fail(path, f"element {j} matches $excludes[{i}] {_show(unwanted)}")
        return None
    return _fail(path, f"unknown operator {key}")


def _match(pattern: Any, value: Any, path: str) -> str | None:
    present = value is not _MISSING
    if pattern == "*":
        return None if present else _fail(path, "missing")
    if _is_operator(pattern):
        return _operator(pattern, value, path)
    if not present:
        return _fail(path, "missing")
    if isinstance(pattern, list):
        if not isinstance(value, list):
            return _fail(path, f"expected a list, got {_show(value)}")
        if len(value) != len(pattern):
            return _fail(path, f"expected {len(pattern)} elements, got {len(value)}")
        for i, (p, v) in enumerate(zip(pattern, value)):
            r = _match(p, v, f"{path}[{i}]")
            if r:
                return r
        return None
    if isinstance(pattern, dict):
        if not isinstance(value, dict):
            return _fail(path, f"expected an object, got {_show(value)}")
        for k, p in pattern.items():
            r = _match(p, value.get(k, _MISSING), f"{path}.{k}" if path else k)
            if r:
                return r
        return None
    # YAML booleans and JSON booleans compare by identity of type, like JavaScript ===.
    if type(pattern) is bool or type(value) is bool:
        ok = type(pattern) is type(value) and pattern == value
    else:
        ok = pattern == value
    return None if ok else _fail(path, f"expected {_show(pattern)}, got {_show(value)}")


def match(pattern: Any, value: Any) -> str | None:
    """Returns None when value matches pattern, else the reason it does not."""
    return _match(pattern, value, "")


def get_path(value: Any, path: str) -> Any:
    for key in path.split("."):
        if isinstance(value, list):
            value = value[int(key)] if key.isdigit() and int(key) < len(value) else None
        elif isinstance(value, dict):
            value = value.get(key)
        else:
            return None
    return value


_WHOLE = re.compile(r"^\$\{([A-Za-z_][A-Za-z0-9_]*)\}$")
_ANY = re.compile(r"\$\{([A-Za-z_][A-Za-z0-9_]*)\}")


def interpolate(value: Any, variables: dict[str, Any]) -> Any:
    def lookup(name: str) -> Any:
        if name not in variables:
            raise KeyError(f"unknown variable ${{{name}}}")
        return variables[name]

    if isinstance(value, str):
        whole = _WHOLE.match(value)
        if whole:
            return lookup(whole.group(1))
        return _ANY.sub(lambda m: str(lookup(m.group(1))), value)
    if isinstance(value, list):
        return [interpolate(v, variables) for v in value]
    if isinstance(value, dict):
        return {k: interpolate(v, variables) for k, v in value.items()}
    return value
