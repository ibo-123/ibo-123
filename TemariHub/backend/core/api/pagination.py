"""Contract-compatible page/page_size pagination helpers.

Response data shape (inside the existing success envelope):

    {
      "items": [...],
      "page": 1,
      "page_size": 20,
      "total": 100
    }
"""

from rest_framework.exceptions import ValidationError


DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


def parse_page_params(query_params, *, default_page_size=DEFAULT_PAGE_SIZE):
    """Parse and validate ``page`` / ``page_size`` from a QueryDict."""
    raw_page = query_params.get("page", "1")
    raw_size = query_params.get("page_size", str(default_page_size))
    errors = {}

    try:
        page = int(raw_page)
    except (TypeError, ValueError):
        errors["page"] = ["Must be a positive integer."]
        page = None
    else:
        if page < 1:
            errors["page"] = ["Must be a positive integer."]

    try:
        page_size = int(raw_size)
    except (TypeError, ValueError):
        errors["page_size"] = [f"Must be an integer between 1 and {MAX_PAGE_SIZE}."]
        page_size = None
    else:
        if page_size < 1 or page_size > MAX_PAGE_SIZE:
            errors["page_size"] = [
                f"Must be an integer between 1 and {MAX_PAGE_SIZE}."
            ]

    if errors:
        raise ValidationError(errors)

    return page, page_size


def paginate_queryset(queryset, *, page, page_size):
    """Slice ``queryset`` and return ``(items_list, total)``."""
    total = queryset.count()
    start = (page - 1) * page_size
    end = start + page_size
    items = list(queryset[start:end])
    return items, total


def pagination_payload(*, items, page, page_size, total):
    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
    }
