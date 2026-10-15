"""Seed a small Grade 12 curriculum for local development and tests.

Data lives only in this command (and the database after seeding). API views and
services continue to read subjects/units/topics from the curriculum tables.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from curriculum.models import Subject, Topic, Unit
from users.models import Stream

GRADE = 12

# Shared subjects use stream=None so both tracks see one row via matches_track().
CURRICULUM = [
    {
        "name": "Mathematics",
        "slug": "mathematics",
        "stream": None,
        "sort_order": 1,
        "units": [
            {
                "name": "Algebra",
                "topics": [
                    ("Sets and Intervals", 45),
                    ("Equations and Inequalities", 60),
                    ("Functions", 60),
                ],
            },
            {
                "name": "Calculus",
                "topics": [
                    ("Limits", 45),
                    ("Differentiation", 60),
                    ("Applications of Derivatives", 60),
                ],
            },
            {
                "name": "Probability",
                "topics": [
                    ("Counting Principles", 45),
                    ("Probability Rules", 45),
                    ("Random Variables", 60),
                ],
            },
        ],
    },
    {
        "name": "English",
        "slug": "english",
        "stream": None,
        "sort_order": 2,
        "units": [
            {
                "name": "Reading Comprehension",
                "topics": [
                    ("Main Ideas and Details", 30),
                    ("Inference and Tone", 45),
                    ("Vocabulary in Context", 30),
                ],
            },
            {
                "name": "Grammar and Usage",
                "topics": [
                    ("Parts of Speech", 30),
                    ("Sentence Structure", 45),
                    ("Common Errors", 45),
                ],
            },
            {
                "name": "Writing Skills",
                "topics": [
                    ("Paragraph Organization", 45),
                    ("Essay Structure", 60),
                    ("Editing and Revision", 45),
                ],
            },
        ],
    },
    {
        "name": "Physics",
        "slug": "physics",
        "stream": Stream.NATURAL_SCIENCE,
        "sort_order": 3,
        "units": [
            {
                "name": "Mechanics",
                "topics": [
                    ("Kinematics", 45),
                    ("Newton's Laws", 60),
                    ("Work and Energy", 60),
                ],
            },
            {
                "name": "Waves and Optics",
                "topics": [
                    ("Wave Properties", 45),
                    ("Sound", 45),
                    ("Reflection and Refraction", 60),
                ],
            },
            {
                "name": "Electricity",
                "topics": [
                    ("Electric Charge", 45),
                    ("Current and Circuits", 60),
                    ("Electromagnetism Basics", 60),
                ],
            },
        ],
    },
    {
        "name": "Chemistry",
        "slug": "chemistry",
        "stream": Stream.NATURAL_SCIENCE,
        "sort_order": 4,
        "units": [
            {
                "name": "Atomic Structure",
                "topics": [
                    ("Atoms and Isotopes", 45),
                    ("Electronic Configuration", 60),
                    ("Periodic Trends", 45),
                ],
            },
            {
                "name": "Chemical Bonding",
                "topics": [
                    ("Ionic Bonding", 45),
                    ("Covalent Bonding", 45),
                    ("Intermolecular Forces", 60),
                ],
            },
            {
                "name": "Stoichiometry",
                "topics": [
                    ("The Mole Concept", 45),
                    ("Balancing Equations", 45),
                    ("Limiting Reactants", 60),
                ],
            },
        ],
    },
    {
        "name": "Biology",
        "slug": "biology",
        "stream": Stream.NATURAL_SCIENCE,
        "sort_order": 5,
        "units": [
            {
                "name": "Cell Biology",
                "topics": [
                    ("Cell Structure", 45),
                    ("Cell Membrane Transport", 45),
                    ("Cell Division", 60),
                ],
            },
            {
                "name": "Genetics",
                "topics": [
                    ("Mendelian Inheritance", 60),
                    ("DNA and Genes", 45),
                    ("Protein Synthesis", 60),
                ],
            },
            {
                "name": "Human Physiology",
                "topics": [
                    ("Digestive System", 45),
                    ("Circulatory System", 45),
                    ("Nervous System", 60),
                ],
            },
        ],
    },
    {
        "name": "Economics",
        "slug": "economics",
        "stream": Stream.SOCIAL_SCIENCE,
        "sort_order": 6,
        "units": [
            {
                "name": "Microeconomics Basics",
                "topics": [
                    ("Demand and Supply", 45),
                    ("Elasticity", 45),
                    ("Market Structures", 60),
                ],
            },
            {
                "name": "Macroeconomics Basics",
                "topics": [
                    ("GDP and Growth", 45),
                    ("Inflation and Unemployment", 60),
                    ("Fiscal Policy", 45),
                ],
            },
            {
                "name": "Ethiopian Economy",
                "topics": [
                    ("Agriculture and Development", 45),
                    ("Trade and Industry", 45),
                    ("Public Finance Overview", 60),
                ],
            },
        ],
    },
    {
        "name": "Geography",
        "slug": "geography",
        "stream": Stream.SOCIAL_SCIENCE,
        "sort_order": 7,
        "units": [
            {
                "name": "Physical Geography",
                "topics": [
                    ("Landforms", 45),
                    ("Climate Systems", 45),
                    ("Natural Resources", 60),
                ],
            },
            {
                "name": "Human Geography",
                "topics": [
                    ("Population Patterns", 45),
                    ("Settlement and Urbanization", 45),
                    ("Economic Activities", 60),
                ],
            },
            {
                "name": "Geography of Ethiopia",
                "topics": [
                    ("Regions and Relief", 45),
                    ("Climate and Vegetation", 45),
                    ("Population and Development", 60),
                ],
            },
        ],
    },
    {
        "name": "History",
        "slug": "history",
        "stream": Stream.SOCIAL_SCIENCE,
        "sort_order": 8,
        "units": [
            {
                "name": "Ancient Civilizations",
                "topics": [
                    ("Early Human Societies", 45),
                    ("River Valley Civilizations", 45),
                    ("Classical Empires", 60),
                ],
            },
            {
                "name": "Modern World History",
                "topics": [
                    ("Industrial Revolution", 45),
                    ("World Wars Overview", 60),
                    ("Cold War and Decolonization", 60),
                ],
            },
            {
                "name": "Ethiopian History",
                "topics": [
                    ("Ancient and Medieval Ethiopia", 45),
                    ("Modern Ethiopian State", 60),
                    ("Twentieth-Century Ethiopia", 60),
                ],
            },
        ],
    },
]


def _seed_subject(entry):
    subject, _ = Subject.objects.update_or_create(
        slug=entry["slug"],
        grade=GRADE,
        stream=entry["stream"],
        defaults={
            "name": entry["name"],
            "is_active": True,
            "sort_order": entry["sort_order"],
        },
    )
    return subject


def _seed_unit(subject, unit_entry, sort_order):
    slug = slugify(unit_entry["name"])
    unit, _ = Unit.objects.update_or_create(
        subject=subject,
        slug=slug,
        defaults={
            "name": unit_entry["name"],
            "is_active": True,
            "sort_order": sort_order,
        },
    )
    return unit


def _seed_topic(unit, topic_name, minutes, sort_order):
    topic, _ = Topic.objects.update_or_create(
        unit=unit,
        slug=slugify(topic_name),
        defaults={
            "name": topic_name,
            "is_active": True,
            "sort_order": sort_order,
            "estimated_study_minutes": minutes,
        },
    )
    return topic


class Command(BaseCommand):
    help = (
        "Seed Grade 12 TemariHub curriculum subjects, units, and topics. "
        "Safe to re-run; existing rows are updated in place."
    )

    @transaction.atomic
    def handle(self, *args, **options):
        subject_count = 0
        unit_count = 0
        topic_count = 0

        for subject_entry in CURRICULUM:
            subject = _seed_subject(subject_entry)
            subject_count += 1

            for unit_index, unit_entry in enumerate(subject_entry["units"], start=1):
                unit = _seed_unit(subject, unit_entry, unit_index)
                unit_count += 1

                for topic_index, (topic_name, minutes) in enumerate(
                    unit_entry["topics"], start=1
                ):
                    _seed_topic(unit, topic_name, minutes, topic_index)
                    topic_count += 1

        self.stdout.write(self.style.SUCCESS("Curriculum seed completed."))
        self.stdout.write(f"Subjects created/updated: {subject_count}")
        self.stdout.write(f"Units created/updated: {unit_count}")
        self.stdout.write(f"Topics created/updated: {topic_count}")
