"""Mark pre-existing phone accounts as verified.

Before password registration existed, the only ways to obtain an account with
a phone number were completing phone-OTP login or being created by staff in
the admin. Both imply the number was already trusted, so those accounts keep
working with password login after this release.
"""
from django.db import migrations
from django.db.models import F


def backfill(apps, schema_editor):
    User = apps.get_model("users", "User")
    User.objects.filter(
        phone_number__isnull=False,
        phone_verified_at__isnull=True,
    ).update(phone_verified_at=F("date_joined"))


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0003_user_profile_and_verification_fields"),
    ]

    operations = [
        migrations.RunPython(backfill, noop),
    ]
