
from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator
from ..models import Kitchentype


class KitchenTypeSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    
    class Meta:
        model =Kitchentype 
        fields = ["id", "name", "branch", "branch_name"]
        read_only_fields = ["branch_name"]
        validators = [
            UniqueTogetherValidator(
                queryset=Kitchentype.objects.all(),
                fields=['branch', 'name']
            )
        ]






