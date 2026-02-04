import { useState, useMemo } from "react";

/* ===== Types ===== */

export interface Medicine {
  id: number;
  name: string;
  price: number;
  stock: number;
}

export interface Customer {
  id: number;
  name: string;
}

export interface InvoiceItem {
  medicine: Medicine;
  quantity: number;
}

interface Props {
  medicines: Medicine[];
  customers: Customer[];
  onAddInvoice: (invoice: unknown) => void;
  setMedicines: (medicines: Medicine[]) => void;
  setCustomers: (customers: Customer[]) => void;
}

/* ===== Component ===== */

export default function CreateInvoiceView({
  medicines,
  customers,
  onAddInvoice,
  setMedicines,
  setCustomers,
}: Props) {
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [discount, setDiscount] = useState("0");
  const [discountType, setDiscountType] = useState<"%" | "₹">("%");
  const [paymentMethod, setPaymentMethod] = useState<
    "Cash" | "Card" | "UPI" | "Split"
  >("Cash");
  const [splitCash, setSplitCash] = useState("0");
  const [splitUPI, setSplitUPI] = useState("0");

  /* ===== Calculations ===== */

  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.medicine.price * item.quantity,
      0
    );
  }, [cart]);

  const discountAmount = useMemo(() => {
    const value = Number(discount) || 0;
    return discountType === "%" ? (subtotal * value) / 100 : value;
  }, [discount, discountType, subtotal]);

  const taxAmount = useMemo(() => {
    return subtotal * 0.05;
  }, [subtotal]);

  const total = useMemo(() => {
    return subtotal - discountAmount + taxAmount;
  }, [subtotal, discountAmount, taxAmount]);

  /* ===== Handlers (logic intentionally minimal) ===== */

  const handleAddItem = (medicine: Medicine) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.medicine.id === medicine.id);
      if (existing) {
        return prev.map((i) =>
          i.medicine.id === medicine.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { medicine, quantity: 1 }];
    });
  };

  const handleQuantityChange = (id: number, qty: number) => {
    setCart((prev) =>
      prev.map((i) =>
        i.medicine.id === id ? { ...i, quantity: qty } : i
      )
    );
  };

  const handleRemoveItem = (id: number) => {
    setCart((prev) => prev.filter((i) => i.medicine.id !== id));
  };

  const handleSaveInvoice = () => {
    const invoice = {
      customer: selectedCustomer,
      items: cart,
      subtotal,
      discount,
      discountType,
      tax: taxAmount,
      total,
      paymentMethod,
      splitCash,
      splitUPI,
      createdAt: new Date().toISOString(),
    };

    onAddInvoice(invoice);

    setCart([]);
    setSelectedCustomer("");
    setDiscount("0");
    setPaymentMethod("Cash");
    setSplitCash("0");
    setSplitUPI("0");
  };

  /* ===== Render ===== */

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left Side */}
      <div className="lg:col-span-2 space-y-4">
        <MedicineSearch medicines={medicines} onAdd={handleAddItem} />

        <CustomerSelect
          customers={customers}
          selectedCustomer={selectedCustomer}
          onSelect={setSelectedCustomer}
          onAddCustomer={(newCust: Customer) =>
            setCustomers([...customers, newCust])
          }
        />

        <CartSummary
          cart={cart}
          onUpdateQty={handleQuantityChange}
          onRemove={handleRemoveItem}
        />
      </div>

      {/* Right Side */}
      <PaymentSection
        subtotal={subtotal}
        discount={discount}
        discountType={discountType}
        tax={taxAmount}
        total={total}
        paymentMethod={paymentMethod}
        splitCash={splitCash}
        splitUPI={splitUPI}
        onChangePayment={setPaymentMethod}
        onChangeDiscount={setDiscount}
        onSave={handleSaveInvoice}
      />
    </div>
  );
}
