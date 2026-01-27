from rest_framework.views import APIView, Response

from ..models import Product
from ..serializer_dir.product_serializer import ProductSerializer


class ProductViewClass(APIView):
    def get_user_role(self, user):
        return "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")

    def get(self, request, id=None):
        role = self.get_user_role(request.user)
        my_branch = request.user.branch
        if id:
            # get single product
            print("this is role hahaha ", role)
            if role in ["BRANCH_MANAGER", "WAITER", "COUNTER", "KITCHEN"]:
                branch_product = Product.objects.get(id=id)
                if branch_product.category.branch == my_branch:
                    product_details = ProductSerializer(branch_product)
                    return Response({"success": True, "data": product_details.data})

            if role in ["SUPER_ADMIN", "ADMIN"]:
                product = Product.objects.get(id=id)
                serilizer = ProductSerializer(product)
                return Response({"success": True, "data": serilizer.data})
        else:
            if role in ["BRANCH_MANAGER", "WAITER", "COUNTER", "KITCHEN"] and my_branch:
                products = Product.objects.filter(category__branch=my_branch)
                serilizer = ProductSerializer(products, many=True)
                return Response({"success": True, "data": serilizer.data})

            if role in ["ADMIN", "SUPER_ADMIN"]:
                products = Product.objects.all()
                serilizer = ProductSerializer(products, many=True)
                return Response({"success": True, "data": serilizer.data})

            if not my_branch:
                return Response(
                    {"success": False, "message": "Branch not found"}, status=400
                )

            return Response(
                {"success": False, "message": "User Type not found"}, status=400
            )

    def post(self, request):
        pass

    def put(self, request, id=None):
        pass

    def delete(self, request, id=None):
        pass
