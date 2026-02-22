from django.db import models
import json
from scraper import scraping
from datetime import datetime, timedelta
from django.utils import timezone

from api.models import IngredientUnit

class Scraper(models.Model):
    cached_url = models.ForeignKey('Source', on_delete=models.SET_NULL, null=True, related_name='best_for')
    cached_price = models.FloatField(null=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def min_price_per_unit(self):
        if self.cached_price and datetime.now(timezone.UTC) - self.updated_at <= timedelta(hours=1):
            return self.cached_price
        self.update()
        return self.cached_price
    
    @property
    def min_url(self):
        if self.cached_source and datetime.now(timezone.UTC) - self.updated_at <= timedelta(hours=1):
            return self.cached_source.url
        self.update()
        return self.cached_source.url

    def update(self):
        min_source, min_price = None, None
        for src in self.sources.all():
            if min_price is None or src.get_price() < min_price:
                min_source = src
                min_price = src.min_price_per_unit
        self.cached_source = min_source
        self.cached_price = min_price
        return min_price
    
class Source(models.Model):
    url: models.CharField[str, str] = models.CharField(max_length=100)
    updated_at = models.DateTimeField(auto_now=True)
    cached_price = models.FloatField(null=True)
    quantity_unit: models.CharField[IngredientUnit, IngredientUnit] = models.CharField(
        max_length=4,
        choices=IngredientUnit.choices,
        default=IngredientUnit.KILOGRAM,
        help_text = (
            "The base unit for the Source stats (e.g., per kg, per liter, etc.)"
        ),
    )
    quantity = models.FloatField(null=False, blank=False)
    scraper = models.ForeignKey(Scraper, on_delete=models.CASCADE, related_name='sources')

    @property
    def min_price_per_unit(self):
        if self.cached_price and datetime.now(timezone.UTC) - self.updated_at <= timedelta(hours=1):
            return self.cached_price
        if 'realcanadiansuperstore' in self.url.split('.'):
            self.cached_price = scraping.from_superstore(self.url.split('/')[-1].split('?')[0]) / self.quantity
        # todo: handle other links
        return self.cached_price