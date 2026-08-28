"""Uncertainty logic and receivable arrival models for CapitalOps Decision Engine."""

from typing import Dict, List
from engine.data_models import Receivable


THRESHOLD_P_ONTIME: float = 0.85


def get_expected_arrival_day(receivable: Receivable) -> int:
    """Return the expected arrival day for a receivable.

    Deterministic rule:
      expected arrival = receivable.expected_day
    """
    return receivable.expected_day


def get_conservative_arrival_day(receivable: Receivable) -> int:
    """Return the conservative arrival day for a receivable.

    Deterministic rule:
      If p_ontime < 0.85:
          conservative arrival = late_day
      Otherwise:
          conservative arrival = expected_day
    """
    if receivable.p_ontime < THRESHOLD_P_ONTIME:
        return receivable.late_day
    return receivable.expected_day


def resolve_receivable_arrivals(
    receivables: List[Receivable],
    use_conservative: bool = False,
) -> Dict[str, int]:
    """Map receivable IDs to their resolved arrival days under expected or conservative scenario."""
    arrivals = {}
    for r in receivables:
        if use_conservative:
            arrivals[r.id] = get_conservative_arrival_day(r)
        else:
            arrivals[r.id] = get_expected_arrival_day(r)
    return arrivals
