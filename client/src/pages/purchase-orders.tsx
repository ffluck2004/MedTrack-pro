import {
  DndContext,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";

const STATUSES = [
  "Draft",
  "Sent",
  "Approved",
  "Received",
  "Completed",
  "Cancelled",
];

export default function PurchaseOrders() {
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor));

  /* ---------------- FETCH ---------------- */

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => apiRequest("GET", "purchase-orders/"),
  });

  const { data: medicines = [] } = useQuery({
    queryKey: ["medicines"],
    queryFn: () => apiRequest("GET", "medicines/"),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => apiRequest("GET", "suppliers/"),
  });

  /* ---------------- STATE ---------------- */

  const [showModal, setShowModal] = useState(false);
  const [formErrors, setFormErrors] = useState<any>({});
  const [formData, setFormData] = useState<any>({
    supplier: "",
    items: [],
  });

  /* ---------------- CREATE PO ---------------- */

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "purchase-orders/", {
        order_number: `PO-${Date.now()}`,
        supplier: Number(formData.supplier),
        total_amount: totalAmount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setShowModal(false);
      resetForm();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: any) =>
      apiRequest("PATCH", `purchase-orders/${id}/`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });

  /* ---------------- FORM ---------------- */

  const resetForm = () => {
    setFormData({
      supplier: "",
      items: [],
    });
    setFormErrors({});
  };

  const validateForm = () => {
    let errors: any = {};

    if (!formData.supplier) errors.supplier = "Supplier required";
    if (formData.items.length === 0)
      errors.items = "Add at least one item";

    formData.items.forEach((item: any, i: number) => {
      if (!item.medicine)
        errors[`medicine_${i}`] = "Select medicine";
      if (!item.quantity || item.quantity <= 0)
        errors[`quantity_${i}`] = "Invalid quantity";
      if (!item.cost || item.cost <= 0)
        errors[`cost_${i}`] = "Invalid cost";
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { medicine: "", quantity: 1, cost: 0 }],
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    setFormData({ ...formData, items: updated });
  };

  const totalAmount = useMemo(() => {
    return formData.items.reduce(
      (sum: number, item: any) =>
        sum + (item.quantity || 0) * (item.cost || 0),
      0
    );
  }, [formData]);

  /* ---------------- DRAG ---------------- */

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    updateStatusMutation.mutate({
      id: active.id,
      status: over.id,
    });
  };

  const grouped = useMemo(() => {
    let map: any = {};
    STATUSES.forEach((s) => (map[s] = []));
    purchaseOrders.forEach((po: any) => {
      map[po.status || "Draft"]?.push(po);
    });
    return map;
  }, [purchaseOrders]);

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Purchase Orders</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg"
        >
          Add Purchase Order
        </button>
      </div>

      {/* KANBAN */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-6 gap-4">
          {STATUSES.map((status) => (
            <Column key={status} id={status} title={status}>
              {grouped[status]?.map((po: any) => (
                <POCard key={po.id} po={po} />
              ))}
            </Column>
          ))}
        </div>
      </DndContext>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl rounded-2xl p-6 space-y-4 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-semibold">
              Add Purchase Order
            </h2>

            <select
              value={formData.supplier}
              onChange={(e) =>
                setFormData({ ...formData, supplier: e.target.value })
              }
              className={`w-full border rounded-lg px-3 py-2 ${formErrors.supplier ? "border-red-500" : ""
                }`}
            >
              <option value="">Select Supplier</option>
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              onClick={addItem}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Add Item
            </button>

            {formData.items.map((item: any, i: number) => (
              <div key={i} className="grid grid-cols-4 gap-3">
                <select
                  value={item.medicine}
                  onChange={(e) =>
                    updateItem(i, "medicine", e.target.value)
                  }
                  className="border rounded px-2 py-1"
                >
                  <option value="">Medicine</option>
                  {medicines.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(i, "quantity", Number(e.target.value))
                  }
                  className="border rounded px-2 py-1"
                />

                <input
                  type="number"
                  placeholder="Cost"
                  value={item.cost}
                  onChange={(e) =>
                    updateItem(i, "cost", Number(e.target.value))
                  }
                  className="border rounded px-2 py-1"
                />

                <div className="font-semibold">
                  ₹{(item.quantity * item.cost).toFixed(2)}
                </div>
              </div>
            ))}

            <div className="text-right font-bold text-lg">
              Total: ₹{totalAmount.toFixed(2)}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="border px-4 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (validateForm()) {
                    createMutation.mutate();
                  }
                }}
                className="bg-primary text-white px-4 py-2 rounded"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- COLUMN ---------------- */

function Column({ id, title, children }: any) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 min-h-[500px]">
      <h3 className="font-semibold mb-3">{title}</h3>
      <SortableContext items={[]} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">{children}</div>
      </SortableContext>
    </div>
  );
}

/* ---------------- CARD ---------------- */

function POCard({ po }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: po.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 cursor-grab"
    >
      <p className="font-semibold">{po.order_number}</p>
      <p className="text-sm">₹{po.total_amount}</p>
    </Card>
  );
}