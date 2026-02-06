from rest_framework import serializers
from .models import (
    Supplier, Customer, Medicine, InventoryItem,
    PurchaseOrder, Invoice, InvoiceItem, Report
)

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = "__all__"

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = "__all__"

class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = "__all__"

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = "__all__"

class PurchaseOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrder
        fields = "__all__"

class InvoiceItemSerializer(serializers.ModelSerializer):
    medicine_id = serializers.PrimaryKeyRelatedField(
        queryset=Medicine.objects.all(),
        source="medicine",
        write_only=True
    )
    medicine_name = serializers.CharField(source="medicine.name", read_only=True)
    returned_quantity = serializers.IntegerField(read_only=True)

    class Meta:
        model = InvoiceItem
        fields = [
            "id",
            "medicine_id",
            "medicine_name",
            "quantity",
            "price",
            "cost",
            "line_total",
            "returned_quantity",
        ]

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)

    customer_name = serializers.CharField(source="customer.name", read_only=True)
    customer_phone = serializers.CharField(source="customer.contact", read_only=True)
    customer_address = serializers.CharField(source="customer.address", read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "created_at",
            "subtotal",
            "discount_value",
            "tax_amount",
            "total",
            "total_cost",
            "admin_name",
            "payment_method",
            "status",
            "customer",
            "items",
            "returned_at",
            "customer_name",
            "customer_phone",
            "customer_address",
        ]
        read_only_fields = ("returned_at",)

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        invoice = Invoice.objects.create(**validated_data)

        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)

        return invoice

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)

        for attr, val in validated_data.items():
            setattr(instance, attr, val)

        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                InvoiceItem.objects.create(invoice=instance, **item_data)

        return instance

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = "__all__"

# -------------------
# RETURN SERIALIZERS
# -------------------
class ReturnItemSerializer(serializers.Serializer):
    invoice_item_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)

class ReturnSerializer(serializers.Serializer):
    items = ReturnItemSerializer(many=True)
