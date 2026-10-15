from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):

    def create_user(self, phone_number, password=None, **extra_fields):
        if phone_number is None or str(phone_number).strip() == "":
            raise ValueError("Phone number is required")

        email = extra_fields.get("email")
        if email:
            extra_fields["email"] = self.normalize_email(email)
        elif "email" in extra_fields:
            extra_fields["email"] = None

        user = self.model(
            phone_number=phone_number,
            **extra_fields,
        )

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_social_user(self, email=None, **extra_fields):
        """Create a user identified by a verified social account.

        Phone number stays empty until the person later verifies one.
        """
        extra_fields.pop("phone_number", None)
        if email:
            email = self.normalize_email(email)
        else:
            email = None

        user = self.model(
            phone_number=None,
            email=email,
            **extra_fields,
        )
        user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True")

        if not password:
            raise ValueError("Superuser must have a password")

        return self.create_user(
            phone_number=phone_number,
            password=password,
            **extra_fields,
        )
