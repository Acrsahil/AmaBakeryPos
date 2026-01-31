from rest_framework.views import APIView, Response

from ..models import Customer
from ..serializer_dir.customer_serializer import CustomerSerializer


class CustomerViewClass(APIView):
    def get_user_role(self, user):
        return "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")

    def get(self, request, id=None):
        role = self.get_user_role(request.user)
        my_branch = getattr(request.user, "branch", None)

        # 1. Handle KITCHEN role - no access
        if role == "KITCHEN":
            return Response(
                {"success": False, "message": "Insufficient permissions"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # 2. Handle GET single customer (with ID)
        if id:
            try:
                customer = Customer.objects.get(id=id)
            except Customer.DoesNotExist:
                return Response(
                    {"success": False, "message": "Customer not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Check permissions for single customer
            if role in ["SUPER_ADMIN", "ADMIN"]:
                # ADMIN and SUPER_ADMIN can view any customer
                pass
            elif role in ["BRANCH_MANAGER", "WAITER", "COUNTER"]:
                # Check if customer belongs to user's branch
                if my_branch and customer.branch != my_branch:
                    return Response(
                        {"success": False, "message": "Customer not in your branch"},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            else:
                return Response(
                    {"success": False, "message": "Insufficient permissions"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            serializer = CustomerSerializer(customer)
            return Response({"success": True, "data": serializer.data})

        # 3. Handle GET all customers (no ID)
        else:
            if role in ["SUPER_ADMIN", "ADMIN"]:
                # SUPER_ADMIN and ADMIN see all customers
                customers = Customer.objects.all()

            elif role in ["BRANCH_MANAGER", "WAITER", "COUNTER"]:
                if not my_branch:
                    return Response(
                        {"success": False, "message": "User not assigned to a branch"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                # Filter by user's branch
                customers = Customer.objects.filter(branch=my_branch)

            else:
                # Other roles (if any) get no customers
                customers = Customer.objects.none()

            # Apply query filters if provided
            search = request.query_params.get("search")
            if search:
                customers = (
                    customers.filter(name__icontains=search)
                    | customers.filter(phone__icontains=search)
                    | customers.filter(email__icontains=search)
                )

            # Order by date (newest first)
            customers = customers.order_by("-date")

            serializer = CustomerSerializer(customers, many=True)

            return Response(
                {"success": True, "count": customers.count(), "data": serializer.data}
            )
