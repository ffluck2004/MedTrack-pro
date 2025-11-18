from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SupplierViewSet, CustomerViewSet, MedicineViewSet,
    InventoryItemViewSet, PurchaseOrderViewSet, InvoiceViewSet, ReportViewSet
)

router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'medicines', MedicineViewSet)
router.register(r'inventory', InventoryItemViewSet)
router.register(r'orders', PurchaseOrderViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'reports', ReportViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
