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
