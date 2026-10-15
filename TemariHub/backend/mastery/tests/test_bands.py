from decimal import Decimal

from django.test import SimpleTestCase

from mastery.bands import MasteryBand, mastery_band
from mastery.constants import STRONG_TOPIC_MIN, WEAK_TOPIC_MAX


class MasteryBandTests(SimpleTestCase):
    def test_band_boundaries(self):
        self.assertEqual(mastery_band(0), MasteryBand.NEEDS_ATTENTION)
        self.assertEqual(mastery_band(39), MasteryBand.NEEDS_ATTENTION)
        self.assertEqual(mastery_band(40), MasteryBand.DEVELOPING)
        self.assertEqual(mastery_band(59), MasteryBand.DEVELOPING)
        self.assertEqual(mastery_band(60), MasteryBand.PROFICIENT)
        self.assertEqual(mastery_band(79), MasteryBand.PROFICIENT)
        self.assertEqual(mastery_band(80), MasteryBand.STRONG)
        self.assertEqual(mastery_band(100), MasteryBand.STRONG)

    def test_threshold_constants_align_with_bands(self):
        self.assertEqual(WEAK_TOPIC_MAX, Decimal("39"))
        self.assertEqual(STRONG_TOPIC_MIN, Decimal("80"))
        self.assertEqual(mastery_band(WEAK_TOPIC_MAX), MasteryBand.NEEDS_ATTENTION)
        self.assertEqual(mastery_band(STRONG_TOPIC_MIN), MasteryBand.STRONG)
