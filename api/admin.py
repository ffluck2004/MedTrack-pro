from django.contrib import admin
from .models import (
    Supplier,
    Customer,
    Medicine,
    InventoryItem,
    PurchaseOrder,
    Invoice,
    InvoiceItem,
    Report,
)

# --------------------------------------------------
# SUPPLIER ADMIN
# --------------------------------------------------

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ("name", "contact", "email", "gst_number", "created_at")
    search_fields = ("name", "contact", "email")
    list_filter = ("created_at",)


# --------------------------------------------------
# CUSTOMER ADMIN
# --------------------------------------------------

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("name", "contact", "email", "created_at")
    search_fields = ("name", "contact")


# --------------------------------------------------
# MEDICINE ADMIN
# --------------------------------------------------

@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "manufacturer",
        "category",
        "stock",
        "price",
        "expiry_date",
        "supplier",
    )
    search_fields = ("name", "manufacturer", "batch_number")
    list_filter = ("category", "supplier")


# --------------------------------------------------
# INVENTORY ADMIN
# --------------------------------------------------

@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ("medicine", "quantity", "location", "last_updated")
    search_fields = ("medicine__name",)


# --------------------------------------------------
# PURCHASE ORDER ADMIN
# --------------------------------------------------

@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number",
        "supplier",
        "status",
        "total_amount",
        "created_at",
    )
    list_filter = ("status",)
    search_fields = ("order_number",)


# --------------------------------------------------
# INVOICE ADMIN
# --------------------------------------------------

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = (
        "invoice_number",
        "customer",
        "total",
        "payment_method",
        "status",
        "created_at",
    )
    list_filter = ("status", "payment_method")
    search_fields = ("invoice_number",)


# --------------------------------------------------
# INVOICE ITEM ADMIN
# --------------------------------------------------

@admin.register(InvoiceItem)
class InvoiceItemAdmin(admin.ModelAdmin):
    list_display = (
        "invoice",
        "medicine",
        "quantity",
        "price",
        "returned_quantity",
    )


# --------------------------------------------------
# REPORT ADMIN
# --------------------------------------------------

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("title", "generated_at")
