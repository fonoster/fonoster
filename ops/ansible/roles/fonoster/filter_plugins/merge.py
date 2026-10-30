# The merge the dev container and the QA stack use too (merge-config.cjs): objects merge, other
# values replace, and null deletes a key.


def fonoster_merge(base, overlay):
    if not isinstance(base, dict) or not isinstance(overlay, dict):
        return overlay
    merged = dict(base)
    for key, value in overlay.items():
        if value is None:
            merged.pop(key, None)
        else:
            merged[key] = fonoster_merge(merged[key], value) if key in merged else value
    return merged


class FilterModule:
    def filters(self):
        return {"fonoster_merge": fonoster_merge}
