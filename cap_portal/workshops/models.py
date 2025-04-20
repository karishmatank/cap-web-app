from django.db import models

# Create your models here.
GRADE_CHOICES = (
    ('11', '11th Grade'),
    ('12', '12th Grade')
)

class WorkshopMaterial(models.Model):
    name=models.CharField(max_length=255)
    number=models.IntegerField(blank=True, null=True)  # I.e. Session 1, 2, etc.
    description=models.TextField(blank=True)
    grade=models.IntegerField(choices=GRADE_CHOICES)
    google_doc_id=models.CharField(blank=True, null=True, max_length=1000)

    def __str__(self):
        return f"{self.name}: {self.description[:20]}"