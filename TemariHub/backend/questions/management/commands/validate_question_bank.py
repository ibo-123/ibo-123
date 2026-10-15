"""Read-only question-bank readiness report.

Usage::

    python manage.py validate_question_bank
"""

from django.core.management.base import BaseCommand

from questions.validation_report import build_question_bank_report


class Command(BaseCommand):
    help = (
        "Report question-bank counts, eligibility, distributions, and whether "
        "the 100 eligible published-question target is met. Read-only."
    )

    def handle(self, *args, **options):
        report = build_question_bank_report()

        self.stdout.write(self.style.SUCCESS("Question bank validation report"))
        self.stdout.write(f"  Total questions: {report['total_questions']}")
        self.stdout.write(f"  Published: {report['published']}")
        self.stdout.write(f"  Drafts: {report['drafts']}")
        self.stdout.write(
            f"  Eligible published (student-visible): {report['eligible_published']}"
        )
        self.stdout.write(
            f"  Target ({report['eligible_target']}): "
            + (
                self.style.SUCCESS("MET")
                if report["eligible_target_met"]
                else self.style.ERROR("NOT MET")
            )
        )
        self.stdout.write(
            f"  Published with invalid option count: "
            f"{report['published_invalid_option_count']}"
        )
        self.stdout.write(
            f"  Published missing correct_option: "
            f"{report['published_missing_correct_option']}"
        )
        self.stdout.write(
            f"  Published on inactive curriculum: "
            f"{report['published_on_inactive_curriculum']}"
        )
        self.stdout.write(
            f"  Concept/topic mismatches: {report['concept_topic_mismatches']}"
        )

        self.stdout.write("  Eligible by subject:")
        if report["eligible_by_subject"]:
            for name, count in report["eligible_by_subject"].items():
                self.stdout.write(f"    - {name}: {count}")
        else:
            self.stdout.write("    (none)")

        self.stdout.write("  Eligible by difficulty:")
        if report["eligible_by_difficulty"]:
            for difficulty, count in report["eligible_by_difficulty"].items():
                self.stdout.write(f"    - {difficulty}: {count}")
        else:
            self.stdout.write("    (none)")

        self.stdout.write("  Notes:")
        for note in report["notes"]:
            self.stdout.write(f"    - {note}")

        if not report["eligible_target_met"]:
            shortfall = report["eligible_target"] - report["eligible_published"]
            self.stderr.write(
                self.style.ERROR(
                    f"Shortfall: {shortfall} eligible published question(s) needed. "
                    "Run seed_curriculum then seed_question_bank, and ensure "
                    "curriculum nodes remain active."
                )
            )
