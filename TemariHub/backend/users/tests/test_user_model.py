import uuid

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import Client, TestCase

from users.phone import InvalidPhoneNumber, normalize_ethiopian_phone

User = get_user_model()


class PhoneNormalizationTests(TestCase):
    def test_local_and_international_formats_match(self):
        self.assertEqual(normalize_ethiopian_phone("0912345678"), "+251912345678")
        self.assertEqual(normalize_ethiopian_phone("+251912345678"), "+251912345678")
        self.assertEqual(normalize_ethiopian_phone("251912345678"), "+251912345678")
        self.assertEqual(normalize_ethiopian_phone("+251 91 234 5678"), "+251912345678")
        self.assertEqual(normalize_ethiopian_phone("0712345678"), "+251712345678")

    def test_invalid_numbers_are_rejected(self):
        for value in ("12345", "+12025550123", "abc", "", "091234567", "912345678"):
            with self.assertRaises(InvalidPhoneNumber):
                normalize_ethiopian_phone(value)


class UserModelTests(TestCase):
    def test_uuid_is_generated(self):
        user = User.objects.create_user("0912345678")

        self.assertIsInstance(user.id, uuid.UUID)

    def test_phone_number_is_unique_across_formats(self):
        User.objects.create_user("0912345678")

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                User.objects.create_user("+251912345678")

    def test_create_user_normalizes_phone_and_has_no_usable_password(self):
        user = User.objects.create_user("0912345678")

        self.assertEqual(user.phone_number, "+251912345678")
        self.assertFalse(user.has_usable_password())

    def test_create_user_requires_a_phone_number(self):
        with self.assertRaises(ValueError):
            User.objects.create_user("")

    def test_create_superuser(self):
        user = User.objects.create_superuser(
            "+251911111111",
            password="a-secure-pass",
        )

        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_active)
        self.assertTrue(user.check_password("a-secure-pass"))

    def test_superuser_requires_a_password(self):
        with self.assertRaises(ValueError):
            User.objects.create_superuser("+251911111112")

    def test_social_user_can_exist_without_a_phone_number(self):
        user = User.objects.create_social_user(email="Student@Example.com")

        self.assertIsNone(user.phone_number)
        self.assertEqual(user.email, "Student@example.com")
        self.assertFalse(user.has_usable_password())

    def test_admin_supports_the_custom_user(self):
        self.assertIn(User, admin.site._registry)
        User.objects.create_superuser("+251911111113", password="a-secure-pass")
        client = Client()

        self.assertTrue(
            client.login(username="+251911111113", password="a-secure-pass")
        )
        response = client.get("/admin/users/user/")

        self.assertEqual(response.status_code, 200)
