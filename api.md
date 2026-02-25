for admin , super admin -> dashboard (Different Ui)
link: http://127.0.0.1:8000/api/calculate/dashboard-details/ for admin,superadmin

note : this is without branch_id
method - get

{
    "success": true,
    "total_sales": 131470.0,
    "total_branch": 2,
    "total_user": 2,
    "total_count_order": 54,
    "average_order_value": 2434.6296296296296,
    "sales_per_category": [
        {
            "product__category__name": "cake",
            "total_category_sum": 114700.0,
            "category_percent": 87.2442382292538
        },
        {
            "product__category__name": "drinks",
            "total_category_sum": 14690.0,
            "category_percent": 11.1736517836769
        }
    ],
    "Weekely_Sales": {
        "monday": 40060.0,
        "tuesday": 2500.0,
        "wednesday": 83290.0,
        "thursday": 0,
        "friday": 0,
        "saturday": 0,
        "sunday": 0
    },
    "top_perfomance_branch": [
        {
            "name": "ama bahradashi",
            "total_sales_per_branch": 129670.0
        },
        {
            "name": "birtamode haul",
            "total_sales_per_branch": 1800.0
        }
    ],
    "top_selling_items": [
        {
            "product__name": "tiramisu",
            "total_sold_units": 251
        },
        {
            "product__name": "butter scotch cake",
            "total_sold_units": 125
        },
        {
            "product__name": "choco milk",
            "total_sold_units": 73
        },
        {
            "product__name": "black forest cake",
            "total_sold_units": 36
        },
        {
            "product__name": "chocolate cake",
            "total_sold_units": 2
        }
    ]
}

get method only
response on postman
{
"success": true,
"today_sales": 24684.0,
"sales_percent": 985.010989010989,
"total_orders": 1,
"order_percent": -92.3076923076923,
"avg_orders": 24684.0,
"avg_order_percent": 14005.142857142857,
"peak_hours": [
"02:00 PM"
],
"total_sales_per_category": [
{
"product__category__name": "Coffee",
"category_total_sales": 24684.0
},
{
"product__category__name": "tea",
"category_total_sales": 4240.0
},
{
"product__category__name": "coffee",
"category_total_sales": 240.0
}
],
"top_selling_items": [
{
"product__name": "chaii",
"total_orders": 30
},
{
"product__name": "bora",
"total_orders": 11
},
{
"product__name": "puff",
"total_orders": 9
},
{
"product__name": "muffin",
"total_orders": 8
},
{
"product__name": "dora",
"total_orders": 5
}
]
}

for reports tab
link: http://127.0.0.1:8000/api/calculate/report-dashboard/1/ for admin,superadmin
link: http://127.0.0.1:8000/api/calculate/report-dashboard/ for branch manager

get method only
response on postman
{
"success": true,
"total_month_sales": 29059.0,
"total_month_orders": 21,
"Weekly_sales": {
"monday": 600.0,
"tuesday": 2275.0,
"wednesday": 24684.0,
"thursday": 0,
"friday": 300.0,
"saturday": 100.0,
"sunday": 100.0
},
"avg_order_month": 1383.7619047619048,
"top_selling_items_count": [
{
"product__name": "chaii",
"total_orders": 30,
"total_sales": 3000.0
},
{
"product__name": "bora",
"total_orders": 11,
"total_sales": 440.0
},
{
"product__name": "puff",
"total_orders": 9,
"total_sales": 90.0
},
{
"product__name": "muffin",
"total_orders": 8,
"total_sales": 800.0
},
{
"product__name": "dora",
"total_orders": 5,
"total_sales": 150.0
}
}
