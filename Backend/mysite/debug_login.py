import os
import django
import json
from django.test import RequestFactory
from django.contrib.auth import get_user_model

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mysite.settings")
django.setup()

from api.views_dir.auth_view import CookieTokenObtainPairView

def test_login_500():
    User = get_user_model()
    # Ensure 'su' exists with a known password
    user, created = User.objects.get_or_create(username='su')
    user.set_password('123')
    user.save()
    
    factory = RequestFactory()
    view = CookieTokenObtainPairView.as_view()
    
    # Try with correct password
    request = factory.post('/api/token/', data=json.dumps({'username': 'su', 'password': '123'}), content_type='application/json')
    try:
        response = view(request)
        print(f"Status Correct: {response.status_code}")
        print(f"Data Correct: {response.data}")
    except Exception as e:
        import traceback
        print(f"Exception Correct: {e}")
        traceback.print_exc()

    # Try with wrong password (to see if it 500s)
    request = factory.post('/api/token/', data=json.dumps({'username': 'su', 'password': 'wrong'}), content_type='application/json')
    try:
        response = view(request)
        print(f"Status Wrong: {response.status_code}")
        print(f"Data Wrong: {response.data}")
    except Exception as e:
        import traceback
        print(f"Exception Wrong: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    test_login_500()
