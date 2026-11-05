# fonoster_inserts: lines added next to an anchor line of a release file. Pure Python, like
# merge.py: the host has neither patch nor git, and deploys install no collection.
import base64
import re


def _anchor(entry):
    if "before" in entry:
        return "before", entry["before"]
    return "after", entry.get("after")


def fonoster_insert_errors(sources, inserts):
    """Why the inserts can't apply to the release files slurped in sources (none: an empty list).
    Names paths and anchors only: an insert's lines can hold a secret."""
    errors = []
    for source in sources:
        path = source["item"]
        if "content" not in source:
            errors.append(
                "fonoster_inserts: this release has no %s; name a file this release ships. "
                "Nothing was changed." % path
            )
            continue
        lines = base64.b64decode(source["content"]).decode("utf-8").splitlines()
        for entry in inserts[path]:
            where, anchor = _anchor(entry)
            if not anchor or not isinstance(entry.get("lines"), str):
                errors.append(
                    "fonoster_inserts: %s: each entry needs before or after, and lines. "
                    "Nothing was changed." % path
                )
                continue
            count = sum(1 for line in lines if re.search(anchor, line))
            if count != 1:
                errors.append(
                    "fonoster_inserts: %s: %s '%s' matches %d lines of this release's file (it "
                    "must match exactly 1); update the anchor from this release's file. Nothing "
                    "was changed." % (path, where, anchor, count)
                )
    return errors


def fonoster_insert(text, entries):
    """text with each entry's lines right before or after the one line its anchor matches, each
    indented like that line. fonoster_insert_errors has checked every anchor."""
    lines = text.splitlines(keepends=True)
    before, after = {}, {}
    for entry in entries:
        where, anchor = _anchor(entry)
        at = next(i for i, line in enumerate(lines) if re.search(anchor, line.rstrip("\r\n")))
        indent = re.match(r"[ \t]*", lines[at]).group(0)
        added = [
            (indent + line if line.strip() else line) + "\n"
            for line in entry["lines"].rstrip("\n").split("\n")
        ]
        (before if where == "before" else after).setdefault(at, []).extend(added)
    out = []
    for i, line in enumerate(lines):
        out += before.get(i, [])
        if i in after and not line.endswith("\n"):
            line += "\n"
        out.append(line)
        out += after.get(i, [])
    return "".join(out)


class FilterModule:
    def filters(self):
        return {
            "fonoster_insert_errors": fonoster_insert_errors,
            "fonoster_insert": fonoster_insert,
        }
