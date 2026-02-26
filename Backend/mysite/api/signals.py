from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Invoice, Payment, InvoiceItem

@receiver([post_save, post_delete], sender=Invoice)
@receiver([post_save, post_delete], sender=Payment)
@receiver([post_save, post_delete], sender=InvoiceItem)
def broadcast_dashboard_update(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            "main_dashboard",
            {
                "type": "dashboard_update",
            }
        )
        # Also update report dashboard if needed
        async_to_sync(channel_layer.group_send)(
            "report_dashboard",
            {
                "type": "dashboard_update", # Both consumers can use the same event type if they handle it
            }
        )
