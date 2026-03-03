import os
import django
from django.core.management import call_command

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mysite.settings")
django.setup()

# Only create if the environment variables are set
if all(os.environ.get(var) for var in ['DJANGO_SUPERUSER_USERNAME', 'DJANGO_SUPERUSER_PASSWORD']):
    try:
        call_command(
            'createsuperuser',
            username=os.environ['DJANGO_SUPERUSER_USERNAME'],
            email=os.environ.get('DJANGO_SUPERUSER_EMAIL', ''),
            interactive=False
        )
        print(f"Superuser created successfully!")
    except Exception as e:
        print(f"Superuser might already exist or error occurred: {e}")
else:
    print("Superuser environment variables not set, skipping creation.")
