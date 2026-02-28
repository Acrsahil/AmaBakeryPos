# backend/api/sse_views.py
import asyncio
import json
from datetime import datetime, timedelta, time
from decimal import Decimal
from django.http import StreamingHttpResponse
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db.models import Sum, Count, Max
from django.db.models.functions import TruncHour, ExtractWeekDay, ExtractYear, ExtractWeek
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from ..views import DashboardViewClass
from ..models import Invoice, Branch, User, Product, InvoiceItem
import logging

logger = logging.getLogger(__name__)

# Store active connections for broadcasting
active_connections = set()

@require_GET
@csrf_exempt
@api_view(['GET'])
@permission_classes([IsAuthenticated])
async def dashboard_sse(request):
    """
    Server-Sent Events endpoint for real-time dashboard updates
    """
    user = request.user
    branch_id = request.GET.get('branch_id')
    
    # Check permissions using your existing logic
    role = "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")
    
    if role not in ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"]:
        return StreamingHttpResponse(
            'event: error\ndata: {"message": "Unauthorized"}\n\n',
            content_type='text/event-stream',
            status=403
        )
    
    async def event_stream():
        # Generate unique connection ID
        connection_id = f"{user.id}_{timezone.now().timestamp()}"
        active_connections.add(connection_id)
        
        # Send initial connection message
        yield f'event: connected\ndata: {json.dumps({"status": "connected", "user": user.username})}\n\n'
        
        # Send initial dashboard data
        initial_data = await get_dashboard_data(user, branch_id, role)
        if initial_data:
            yield f'event: dashboard_update\ndata: {json.dumps(initial_data)}\n\n'
        
        last_check = timezone.now()
        heartbeat_count = 0
        
        try:
            while True:
                # Check for database changes every 2 seconds
                if await has_dashboard_data_changed(user, branch_id, last_check):
                    new_data = await get_dashboard_data(user, branch_id, role)
                    if new_data:
                        yield f'event: dashboard_update\ndata: {json.dumps(new_data)}\n\n'
                    last_check = timezone.now()
                
                # Send heartbeat every 15 seconds to keep connection alive
                heartbeat_count += 1
                if heartbeat_count >= 7:  # ~14 seconds with 2s sleep
                    yield ': heartbeat\n\n'
                    heartbeat_count = 0
                
                await asyncio.sleep(2)
                
        except asyncio.CancelledError:
            # Clean up on disconnect
            active_connections.discard(connection_id)
            logger.info(f"SSE connection closed for user {user.username}")
        except Exception as e:
            logger.error(f"SSE error for user {user.username}: {e}")
            active_connections.discard(connection_id)
    
    response = StreamingHttpResponse(
        event_stream(),
        content_type='text/event-stream'
    )
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'  # Disable nginx buffering
    return response

async def has_dashboard_data_changed(user, branch_id, since):
    """
    Quick check if any relevant data has changed
    """
    # Check for new invoices since last check
    if branch_id:
        new_invoices = await sync_to_async(Invoice.objects.filter(
            branch_id=branch_id,
            created_at__gt=since
        ).exists)()
        
        # Check for new payments
        from ..models import Payment
        new_payments = await sync_to_async(Payment.objects.filter(
            invoice__branch_id=branch_id,
            created_at__gt=since
        ).exists)()
        
    else:
        # For superadmin - check all branches
        new_invoices = await sync_to_async(Invoice.objects.filter(
            created_at__gt=since
        ).exists)()
        
        new_payments = await sync_to_async(Payment.objects.filter(
            created_at__gt=since
        ).exists)()
    
    return new_invoices or new_payments

async def get_dashboard_data(user, branch_id, role):
    """
    Get dashboard data using your existing DashboardViewClass logic
    """
    try:
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        if role in ["SUPER_ADMIN", "ADMIN"] and not branch_id:
            # Global summary for superadmin
            total_sum = await sync_to_async(
                lambda: Invoice.objects.aggregate(total=Sum("total_amount"))["total"] or 0
            )()
            
            total_count_branch = await sync_to_async(Branch.objects.count)()
            total_count_order = await sync_to_async(Invoice.objects.count)()
            total_user_count = await sync_to_async(User.objects.count)()
            average = total_sum / total_count_order if total_count_order else 0
            
            # Get weekly sales
            start_of_week = today - timedelta(days=today.weekday())  # Monday
            end_of_week = start_of_week + timedelta(days=6)
            
            current_week_data = await sync_to_async(
                lambda: list(
                    Invoice.objects.filter(
                        created_at__date__gte=start_of_week,
                        created_at__date__lte=end_of_week,
                    )
                    .annotate(
                        year=ExtractYear("created_at"),
                        week=ExtractWeek("created_at"),
                        weekday=ExtractWeekDay("created_at"),
                    )
                    .values("year", "week", "weekday")
                    .annotate(total_sales=Sum("total_amount"))
                    .order_by("year", "week", "weekday")
                )
            )()
            
            days = {
                "monday": 0, "tuesday": 0, "wednesday": 0,
                "thursday": 0, "friday": 0, "saturday": 0, "sunday": 0
            }
            
            for item in current_week_data:
                if item["weekday"] == 2:
                    days["monday"] = float(item["total_sales"] or 0)
                elif item["weekday"] == 3:
                    days["tuesday"] = float(item["total_sales"] or 0)
                elif item["weekday"] == 4:
                    days["wednesday"] = float(item["total_sales"] or 0)
                elif item["weekday"] == 5:
                    days["thursday"] = float(item["total_sales"] or 0)
                elif item["weekday"] == 6:
                    days["friday"] = float(item["total_sales"] or 0)
                elif item["weekday"] == 7:
                    days["saturday"] = float(item["total_sales"] or 0)
                elif item["weekday"] == 1:
                    days["sunday"] = float(item["total_sales"] or 0)
            
            # Get top selling items
            top_selling_items = await sync_to_async(
                lambda: list(
                    InvoiceItem.objects.values("product__name")
                    .annotate(total_quantity=Sum("quantity"))
                    .order_by("-total_quantity")[:5]
                )
            )()
            
            return {
                "success": True,
                "total_sales": float(total_sum),
                "total_branch": total_count_branch,
                "total_user": total_user_count - 1,
                "total_count_order": total_count_order,
                "average_order_value": float(average),
                "weekly_sales": days,
                "top_selling_items": top_selling_items,
                "update_type": "initial"
            }
        else:
            # Branch-specific data
            my_branch = branch_id or getattr(user, "branch_id", None)
            if not my_branch:
                return None
            
            # Get today's invoices
            today_invoices = await sync_to_async(
                lambda: list(Invoice.objects.filter(
                    branch_id=my_branch,
                    created_at__date=today
                ))
            )()
            
            yesterday_invoices = await sync_to_async(
                lambda: list(Invoice.objects.filter(
                    branch_id=my_branch,
                    created_at__date=yesterday
                ))
            )()
            
            # Calculate totals
            today_sales = sum(i.total_amount for i in today_invoices)
            yesterday_sales = sum(i.total_amount for i in yesterday_invoices)
            
            if yesterday_sales == 0:
                sales_percent = float(today_sales - yesterday_sales)
            else:
                sales_percent = ((today_sales - yesterday_sales) / yesterday_sales) * 100
            
            # Orders count
            today_total_orders = len(today_invoices)
            yesterday_orders = len(yesterday_invoices)
            
            if yesterday_orders == 0:
                order_percent = float(today_total_orders - yesterday_orders)
            else:
                order_percent = ((today_total_orders - yesterday_orders) / yesterday_orders) * 100
            
            # Average order value
            if today_total_orders == 0:
                today_avg_order = 0
            else:
                today_avg_order = float(today_sales / today_total_orders)
            
            # Get hourly data for peak hours
            hourly_data = await sync_to_async(
                lambda: list(
                    Invoice.objects.filter(
                        branch_id=my_branch,
                        created_at__date=today
                    )
                    .annotate(hour=TruncHour("created_at"))
                    .values("hour")
                    .annotate(total_orders=Count("id"))
                    .order_by("hour")
                )
            )()
            
            # Find peak hours
            if hourly_data:
                max_orders = max(item["total_orders"] for item in hourly_data)
                peak_hours = [
                    item["hour"].strftime("%I:%M %p") 
                    for item in hourly_data 
                    if item["total_orders"] == max_orders
                ]
            else:
                peak_hours = []
            
            # Get top selling items for this branch
            top_selling_items = await sync_to_async(
                lambda: list(
                    InvoiceItem.objects.filter(
                        invoice__branch_id=my_branch,
                        invoice__created_at__date=today
                    )
                    .values("product__name")
                    .annotate(total_quantity=Sum("quantity"))
                    .order_by("-total_quantity")[:5]
                )
            )()
            
            # Get sales by category
            sales_by_category = await sync_to_async(
                lambda: list(
                    InvoiceItem.objects.filter(
                        invoice__branch_id=my_branch,
                        invoice__created_at__date=today
                    )
                    .values("product__category__name")
                    .annotate(total_sales=Sum("line_total"))
                    .order_by("-total_sales")[:5]
                )
            )()
            
            return {
                "success": True,
                "today_sales": float(today_sales),
                "sales_percent": float(sales_percent),
                "total_orders": today_total_orders,
                "order_percent": float(order_percent),
                "avg_orders": float(today_avg_order),
                "peak_hours": peak_hours,
                "top_selling_items": top_selling_items,
                "sales_by_category": sales_by_category,
                "update_type": "branch_update"
            }
            
    except Exception as e:
        logger.error(f"Error getting dashboard data: {e}")
        return None

# Helper for async database calls
from asgiref.sync import sync_to_async

# Function to manually trigger updates (call this from your signals)
def trigger_dashboard_update(branch_id=None):
    """
    Manually trigger dashboard update for all connected clients
    """
    # This would be used with Django Channels if you set it up
    # For now, we're using the polling approach in the event_stream
    logger.info(f"Dashboard update triggered for branch: {branch_id}")
