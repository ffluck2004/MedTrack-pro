export default function CreateInvoiceView({ medicines, customers, onAddInvoice, setMedicines, setCustomers }: Props) {
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [discount, setDiscount] = useState("0");
  const [discountType, setDiscountType] = useState<"%" | "₹">("%");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card" | "UPI" | "Split">("Cash");
  const [splitCash, setSplitCash] = useState("0");
  const [splitUPI, setSplitUPI] = useState("0");
  
  // subtotal, tax, discount calculations (same logic you have)
  // handleAddItem, handleQuantityChange, handleRemoveItem, etc.

  const handleSaveInvoice = () => {
    // validation
    // create invoice object
    // call onAddInvoice(invoice)
    // update medicines stock
    // reset form
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left Side */}
      <div className="lg:col-span-2 space-y-4">
        <MedicineSearch medicines={medicines} onAdd={handleAddItem} />
        <CustomerSelect
          customers={customers}
          selectedCustomer={selectedCustomer}
          onSelect={setSelectedCustomer}
          onAddCustomer={(newCust) => setCustomers([...customers, newCust])}
        />
        <CartSummary cart={cart} onUpdateQty={handleQuantityChange} onRemove={handleRemoveItem} />
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
