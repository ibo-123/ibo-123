from unittest.mock import patch

from django.db.utils import OperationalError
from django.test import TestCase
from rest_framework.test import APIClient


class HealthCheckTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_check_reports_a_live_database(self):
        response = self.client.get("/api/v1/health/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "success": True,
                "message": "TemariHub API is healthy",
                "data": {
                    "status": "ok",
                    "database": "connected",
                },
            },
        )

    @patch("core.api.v1.views.connection.ensure_connection", side_effect=OperationalError("down"))
    def test_health_check_reports_a_database_failure(self, _connection):
        response = self.client.get("/api/v1/health/")

        self.assertEqual(response.status_code, 503)
        self.assertFalse(response.data["success"])
        self.assertEqual(
            response.data["errors"]["database"],
            "Unable to connect to PostgreSQL.",
        )
