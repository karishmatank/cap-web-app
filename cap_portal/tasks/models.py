from django.contrib.auth.models import User
from django.db import models

# Create your models here.
SCHOOL_PLATFORM_CHOICES = (
    ('common_app', 'Common App'),
    ('questbridge', 'Questbridge'),
    ('cuny', 'CUNY'),
    ('suny', 'SUNY'),
)

PARENT_CATEGORY_CHOICES = (
    ('school', 'School'),
    ('internship', 'Internship'),
    ('financial_aid', 'Financial Aid'),
    ('scholarship', 'Scholarship'),
    ('other', 'Other')
)

STATUS_CHOICES = (
    ('in_progress', 'In Progress'),
    ('submitted', 'Submitted')
)

TAG_CHOICES = (
    ('activities', 'Activity List'),
    ('application', 'Application'),
    ('fit', 'Assess College Fit'),
    ('interview', 'Interview'),
    ('lor', 'Letters of Recommendation'),
    ('story', 'Personal Story'),
    ('transcript', 'Transcript'),
    ('test_scores', 'Test Scores'),
    ('writing', 'Writing'),
    ('other', 'Other')
)

class Application(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="applications")
    name = models.CharField(max_length=255)
    category = models.CharField(choices=PARENT_CATEGORY_CHOICES, max_length=50)
    notes = models.TextField(blank=True)
    status = models.CharField(choices=STATUS_CHOICES, max_length=50, default="in_progress")

    # Platform would allow us to link a school with Common App
    platform_template=models.ForeignKey('PlatformTemplate', null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f"{self.name} ({self.category})"

class ToDo(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="todos")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    tags = models.CharField(max_length=500, blank=True)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="todos")
    
    def __str__(self):
        return f"{self.name}: {'Completed' if self.completed else 'Not Completed'}"
    
class PlatformTemplate(models.Model):
    name = models.CharField(choices=SCHOOL_PLATFORM_CHOICES, max_length=255)
    category = models.CharField(choices=PARENT_CATEGORY_CHOICES, default="school", max_length=50)

    def __str__(self):
        return f"{self.name} ({self.category})"

class PlatformTemplateToDo(models.Model):
    name = models.CharField(max_length=255)
    platform = models.ForeignKey(PlatformTemplate, on_delete=models.CASCADE, related_name="todos")
    tags = models.CharField(max_length=500, blank=True)

    def __str__(self):
        return f"{self.name} - {self.platform.name}"
    
class PlatformTemplateSubmission(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="checked_platforms")
    platform_template = models.ForeignKey(PlatformTemplate, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.user}, {self.platform_template}"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'platform_template'],
                name='unique_user_platform_submission'
            )
        ]