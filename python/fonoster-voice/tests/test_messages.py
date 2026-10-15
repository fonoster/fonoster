import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import generate_messages  # noqa: E402

from fonoster.voice import messages  # noqa: E402


def test_generated_messages_are_up_to_date():
    assert generate_messages.OUT.read_text() == generate_messages.generate(), (
        "run python/generate_messages.py after changing the session schemas"
    )


def test_types_cover_both_directions():
    assert messages.PROTOCOL == "fonoster.session.v1"
    assert messages.Speak.__required_keys__ == {"type", "text"}
    assert "relatesTo" in messages.ErrorMessage.__optional_keys__
