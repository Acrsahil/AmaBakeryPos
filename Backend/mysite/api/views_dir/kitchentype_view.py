from rest_framework import status
from rest_framework.views import APIView, Response
from django.shortcuts import get_object_or_404
from ..models import Kitchentype, ProductCategory
from ..serializer_dir.kitchentype_serilizer import KitchenTypeSerializer


class KitchenViewClass(APIView):
    def get_user_role(self, user):
        return "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")

    def get(self, request, id=None):
        my_branch = request.user.branch
        role = self.get_user_role(request.user)

        if id:
            if role not in ["ADMIN", "SUPER_ADMIN"]:
                if not my_branch:
                    return Response(
                        {"success": False, "message": "Branch not assigned."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                try:
                    kitchentype = Kitchentype.objects.get(id=id, branch=my_branch)
                except Kitchentype.DoesNotExist:
                    return Response(
                        {"success": False, "message": "Kitchen type not found."},
                        status=status.HTTP_404_NOT_FOUND
                    )

            serializer = KitchenTypeSerializer(kitchentype)
            return Response({"success": True, "data": serializer.data})

        else:
            if role in ["ADMIN", "SUPER_ADMIN"]:
                kitchentype = Kitchentype.objects.all()
            else:
                kitchentype = Kitchentype.objects.filter(branch=my_branch)

            serializer = KitchenTypeSerializer(kitchentype, many=True)
            return Response({"success": True, "data": serializer.data})


    def post(self, request):
        my_branch = request.user.branch
        role = self.get_user_role(request.user)

        if role == "BRANCH_MANAGER":
            if not my_branch:
                return Response(
                    {"success": False, "message": "Branch not assigned."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            data = request.data.copy()
            data["branch"] = my_branch.id
            serializer = KitchenTypeSerializer(data=data)

            if serializer.is_valid():
                try:
                    serializer.save()
                    return Response(
                        {
                            "success": True,
                            "message": "Kitchen Type added",
                            "data": serializer.data
                        },
                        status=status.HTTP_201_CREATED
                    )
                except Exception:
                    return Response(
                        {
                            "success": False,
                            "message": "Something went wrong while saving."
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

            return Response(
                {"success": False, "message": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {"success": False, "message": "Permission denied"},
            status=status.HTTP_403_FORBIDDEN
        )

    def patch(self, request, id):
        my_branch = request.user.branch
        role = self.get_user_role(request.user)
        if not id:
            return Response(
                {"success": False, "message": "Id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if role != "BRANCH_MANAGER":
            return Response(
                {"success": False, "message": "Permissions not given"},
                status=status.HTTP_403_FORBIDDEN
            )
        if not my_branch:
            return Response(
                {"success": False, "message": "Branch not assigned"},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            kitchentype = Kitchentype.objects.get(id=id, branch=my_branch)
        except Kitchentype.DoesNotExist:
            return Response(
                {"success": False, "message": "Kitchen Type not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = KitchenTypeSerializer(
            kitchentype,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            try:
                serializer.save()
                return Response(
                    {
                        "success": True,
                        "message": "Kitchen Type Updated successfully.",
                        "data": serializer.data
                    },
                    status=status.HTTP_200_OK
                )
            
            except Exception:
                return Response(
                    {
                        "success": False,
                        "message": "Something went wrong while updating."
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        return Response(
            {"success": False, "message": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def delete(self, request, id):
        my_branch = request.user.branch
        role = self.get_user_role(request.user)
        if not id:
            return Response(
                {"success": False, "message": "Id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if role != "BRANCH_MANAGER":
            return Response(
                {"success": False, "message": "Permissions not given"},
                status=status.HTTP_403_FORBIDDEN
            )
        if not my_branch:
            return Response(
                {"success": False, "message": "Branch not assigned"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            kitchentype = Kitchentype.objects.get(id=id, branch=my_branch)
        except Kitchentype.DoesNotExist:
            return Response(
                {"success": False, "message": "Kitchen Type not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            kitchentype.delete()
            return Response(
                {"success": True, "message": "Kitchen Type deleted successfully."},
                status=status.HTTP_200_OK
            )
        except Exception:
            return Response(
                {
                    "success": False,
                    "message": "Something went wrong while deleting."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )




