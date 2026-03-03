from rest_framework import status
from rest_framework.views import APIView, Response
from django.shortcuts import get_object_or_404
from ..models import Kitchentype, ProductCategory
from ..serializer_dir.kitchentype_serilizer import KitchenTypeSerializer


class KitchenViewClass(APIView):
    def get_user_role(self, user):
        return "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")


    def get(self,request,id=None):
        my_branch = request.user.branch
        role = self.get_user_role(request.user)
        if id:
            kitchentype = Kitchentype.objects.get_object_or_404(id=id)
            serilizer = KitchenTypeSerializer(kitchentype)


        if role in ["ADMIN","SUPER_ADMIN"]:
            kitchentype = Kitchentype.objects.all()
            serilizer = KitchenTypeSerializer(kitchentype)

        return Response({"success":True,"data" :serilizer.data})

        

        




        # if id:


