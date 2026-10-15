from django.apps import AppConfig
from django.contrib import admin


class AuthenticationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "authentication"
    verbose_name = "Authentication"

    def ready(self):
        # Inject SMS dashboard counts into the Django admin index.
        # Counts come from SMSMessage — the single source of truth.
        if getattr(admin.site, "_temarihub_sms_stats_patched", False):
            return

        original_each_context = admin.site.each_context

        def each_context(request):
            context = original_each_context(request)
            from authentication.models import SMSMessage

            context["sms_stats"] = SMSMessage.dashboard_counts()
            return context

        admin.site.each_context = each_context
        admin.site._temarihub_sms_stats_patched = True
