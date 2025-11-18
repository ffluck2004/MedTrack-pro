from rest_framework import viewsets
from .models import Supplier, Customer, Medicine, InventoryItem, PurchaseOrder, Invoice, Report
from .serializers import (
    SupplierSerializer, CustomerSerializer, MedicineSerializer,
    InventoryItemSerializer, PurchaseOrderSerializer, InvoiceSerializer, ReportSerializer
)


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by('-created_at')
    serializer_class = SupplierSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('-created_at')
    serializer_class = CustomerSerializer


class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all().order_by('-created_at')
    serializer_class = MedicineSerializer


class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all().order_by('-last_updated')
    serializer_class = InventoryItemSerializer


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all().order_by('-created_at')
    serializer_class = PurchaseOrderSerializer


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer


class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all().order_by('-generated_at')
    serializer_class = ReportSerializer
