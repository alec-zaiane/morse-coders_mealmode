from django.contrib import admin
from . import models
admin.site.register(models.Source)
admin.site.register(models.Scraper)