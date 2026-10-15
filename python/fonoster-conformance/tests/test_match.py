from fonoster_conformance import interpolate, load_scenarios, match


def test_partial_objects_and_wildcards():
    assert match({"type": "mark", "name": "*"}, {"type": "mark", "name": None, "x": 1}) is None
    assert match({"name": "*"}, {}) is not None
    assert match({"v": {"$eq": "*"}}, {"v": "x"}) is not None


def test_operators_match_the_typescript_runner():
    assert match({"$gte": 5}, 5) is None
    assert match({"$lt": 5}, 5) is not None
    assert match({"$near": 1800, "$tolerance": 100}, 1750) is None
    assert match({"$re": "^Your"}, "Your balance") is None
    assert match({"$oneOf": ["a", "b"]}, "b") is None
    assert match({"x": {"$absent": True}}, {}) is None
    assert match({"$includes": [{"id": 1}]}, [{"id": 2}, {"id": 1, "side": "in"}]) is None
    assert "unknown operator" in match({"$sometimes": 1}, 1)


def test_booleans_are_not_numbers():
    assert match(True, 1) is not None
    assert match(1, True) is not None


def test_interpolation_keeps_types():
    assert interpolate({"id": "${sid}", "t": "id ${sid}", "n": "${n}"}, {"sid": "s1", "n": 3}) == {
        "id": "s1",
        "t": "id s1",
        "n": 3,
    }


def test_shared_scenarios_validate():
    for contract in ("voice-session", "twilio-media-streams-flavor", "voice-sdk"):
        assert load_scenarios(contract)
