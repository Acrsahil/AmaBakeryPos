import json

from channels.generic.websocket import AsyncWebsocketConsumer


class KitchenOrdersConsumer(AsyncWebsocketConsumer):
    """
    Simple broadcast consumer for kitchen screens.
    Any time a new invoice is created, we send a group message
    and each connected kitchen client triggers a data refresh.
    """

    async def connect(self):
        self.group_name = "kitchen_orders"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("kitchen_orders", self.channel_name)

    async def invoice_created(self, event):
        """
        Handler for messages of type 'invoice_created' sent via channel_layer.group_send.
        """
        await self.send(
            text_data=json.dumps(
                {
                    "type": "invoice_created",
                    "invoice_id": event.get("invoice_id"),
                }
            )
        )
