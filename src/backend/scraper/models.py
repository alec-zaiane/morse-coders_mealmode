from django.db import models
import json
from scraper import scraping
from datetime import datetime, timedelta
from django.utils import timezone

class Scraper(models.Model):
    @property
    def min_price(self):
        return min([e.get_price() for e in self.sources])
    
class Source(models.Model):
    url: models.CharField[str, str] = models.CharField(max_length=100)
    updated_at = models.DateTimeField(auto_now=True)
    cached_price = models.FloatField(null=True)
    scraper = models.ForeignKey(Scraper, on_delete=models.CASCADE)

    @property
    def min_price(self):
        code = self.url.split('/')[-1].split('?')[0]
        if self.cached_price and datetime.now(timezone.UTC) - self.updated_at <= timedelta(hours=1):
            return self.cached_price
        if 'realcanadiansuperstore' in self.url.split('.'):
            self.cached_price = scraping.from_superstore(code)
        # todo: handle other links
        return self.cached_price