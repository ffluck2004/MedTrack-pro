from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SupplierViewSet, CustomerViewSet, MedicineViewSet,
    InventoryItemViewSet, PurchaseOrderViewSet,
    InvoiceViewSet, ReportViewSet
)

router = DefaultRouter()
router.register(r"suppliers", SupplierViewSet, basename="supplier")
router.register(r"customers", CustomerViewSet, basename="customer")
router.register(r"medicines", MedicineViewSet, basename="medicine")
router.register(r"inventory-items", InventoryItemViewSet, basename="inventoryitem")
router.register(r"purchase-orders", PurchaseOrderViewSet, basename="purchaseorder")
router.register(r"invoices", InvoiceViewSet, basename="invoice")
router.register(r"reports", ReportViewSet, basename="report")

urlpatterns = [
    path("", include(router.urls)),
]
