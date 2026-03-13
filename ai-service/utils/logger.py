"""Structured JSON logger for the AI service."""
import logging
import sys
from pythonjsonlogger import jsonlogger


def _build_logger(name: str = "steadypocket-ai") -> logging.Logger:
    _logger = logging.getLogger(name)
    if not _logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = jsonlogger.JsonFormatter(
            fmt="%(asctime)s %(levelname)s %(name)s %(message)s"
        )
        handler.setFormatter(formatter)
        _logger.addHandler(handler)
        _logger.setLevel(logging.INFO)
    return _logger


logger = _build_logger()
