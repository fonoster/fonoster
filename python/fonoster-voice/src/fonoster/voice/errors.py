from __future__ import annotations


class SessionError(Exception):
    """A command failed: the gateway sent ``error`` with ``relatesTo`` set to the command's id."""

    def __init__(self, code: str, message: str, fatal: bool = False):
        super().__init__(message)
        self.code = code
        self.message = message
        self.fatal = fatal


class SessionEndedError(Exception):
    """The session ended (or a fatal error arrived) while the command was pending."""

    def __init__(self, reason: str):
        super().__init__(f"the session ended ({reason})")
        self.reason = reason

