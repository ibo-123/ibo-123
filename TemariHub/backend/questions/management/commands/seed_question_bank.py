"""Idempotent practice question-bank seed.

Usage::

    python manage.py seed_question_bank
    python manage.py seed_question_bank --dry-run

Requires an existing Grade 12 curriculum (``seed_curriculum``). Creates any
missing Concept rows referenced by blueprints, then publishes practice MCQs
through the standard question validation path.
"""

from django.core.management.base import BaseCommand

from questions.seeding import curriculum_gap_report, seed_question_bank


class Command(BaseCommand):
    help = (
        "Seed TemariHub practice questions (idempotent). "
        "Uses deterministic UUIDs from seed keys; does not delete or alter "
        "manually authored questions."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Validate and report actions without persisting changes.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        gap = curriculum_gap_report()
        self.stdout.write("Curriculum readiness (before seed):")
        for key, value in gap.items():
            self.stdout.write(f"  {key}: {value}")

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry-run mode — no writes persisted."))

        stats = seed_question_bank(dry_run=dry_run)

        label = "would create" if dry_run else "created"
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Question bank seed summary"))
        self.stdout.write(f"  Questions {label}: {stats.created}")
        self.stdout.write(
            f"  Questions {'would update' if dry_run else 'updated'}: {stats.updated}"
        )
        self.stdout.write(f"  Questions skipped (unchanged): {stats.skipped}")
        self.stdout.write(f"  Questions failed: {stats.failed}")
        self.stdout.write(f"  Concepts created: {stats.concepts_created}")
        self.stdout.write(f"  Concepts reused: {stats.concepts_reused}")

        if stats.missing_topics:
            self.stdout.write(self.style.ERROR("Missing curriculum topics:"))
            for path in stats.missing_topics:
                self.stdout.write(f"  - {path}")

        if stats.failures:
            self.stdout.write(self.style.ERROR("Failures:"))
            for item in stats.failures[:50]:
                self.stdout.write(f"  - {item}")
            if len(stats.failures) > 50:
                self.stdout.write(f"  ... and {len(stats.failures) - 50} more")

        if stats.failed and not dry_run:
            self.stderr.write(
                self.style.ERROR(
                    f"Completed with {stats.failed} failure(s). "
                    "Fix curriculum gaps or blueprints, then re-run."
                )
            )
