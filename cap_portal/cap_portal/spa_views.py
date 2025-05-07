from pathlib import Path
from django.conf import settings
from django.http import HttpResponse
from django.views import View

class SPAView(View):
    spa_folder = ""

    def get(self, request, *args, **kwargs):
        build_dir = Path(settings.BASE_DIR).parent / self.spa_folder / "build" / "index.html"
        return HttpResponse(build_dir.read_text(encoding='utf-8'), content_type="text/html")

class ChatSPAView(SPAView):
    spa_folder = 'frontend'

class DirectorySPAView(SPAView):
    spa_folder = 'community-frontend'

class ApplicationsSPAView(SPAView):
    spa_folder = 'todos-frontend'