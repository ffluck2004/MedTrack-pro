# api/views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction

from .models import (
    Supplier, Customer, Medicine, InventoryItem,
    PurchaseOrder, Invoice, InvoiceItem, Report
)

from .serializers import (
    SupplierSerializer, CustomerSerializer, MedicineSerializer,
    InventoryItemSerializer, PurchaseOrderSerializer,
    InvoiceSerializer, InvoiceItemSerializer, ReportSerializer,
    ReturnSerializer
)

# ------------------ BASIC CRUD VIEWSETS ------------------

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by("-id")
    serializer_class = SupplierSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by("-id")
    serializer_class = CustomerSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        contact = self.request.query_params.get("contact")
        name = self.request.query_params.get("name")

        if contact:
            qs = qs.filter(contact__icontains=contact)
        if name:
            qs = qs.filter(name__icontains=name)

        return qs


class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all().order_by("-id")
    serializer_class = MedicineSerializer


class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all().order_by("-id")
    serializer_class = InventoryItemSerializer


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all().order_by("-id")
    serializer_class = PurchaseOrderSerializer


class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all().order_by("-id")
    serializer_class = ReportSerializer


# ------------------ INVOICE VIEWSET ------------------

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by("-id")
    serializer_class = InvoiceSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        invoice = serializer.save()

        # Deduct stock for each invoice item
        for item in invoice.items.all():
            med = item.medicine
            med.stock = max(0, med.stock - item.quantity)
            med.save()

        return invoice

    @action(detail=True, methods=["POST"])
    @transaction.atomic
    def return_items(self, request, pk=None):
        invoice = self.get_object()
        serializer = ReturnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data["items"]

        for entry in data:
            item_id = entry["invoice_item_id"]
            qty = entry["quantity"]

            try:
                item = InvoiceItem.objects.get(id=item_id, invoice=invoice)
            except InvoiceItem.DoesNotExist:
                return Response({"error": "Item not found"}, status=404)

            max_available = item.quantity - item.returned_quantity
            if qty > max_available:
                return Response({"error": "Return exceeds sold quantity"}, status=400)

            # Apply return
            item.returned_quantity += qty
            item.save()

            # Restore stock
            med = item.medicine
            med.stock += qty
            med.save()

        invoice.status = "Returned"
        invoice.returned_at = timezone.now()
        invoice.save()

        return Response(InvoiceSerializer(invoice).data)
