export default function InvoiceHistoryView({ invoices, onReturn, medicines, setMedicines }: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = invoices.filter(
    (i) =>
      i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.customerName?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const handleReturn = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv || inv.status === "Returned") return;
    const updated = invoices.map((i) =>
      i.id === id ? { ...i, status: "Returned" } : i
    );
    // restock logic
    const restocked = medicines.map((m) => {
      const item = inv.items.find((x) => x.medicineId === m.id);
      return item ? { ...m, stock: m.stock + item.quantity } : m;
    });
    setMedicines(restocked);
    onReturn(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice History</CardTitle>
        <Input placeholder="Search invoice or customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filtered.map((inv) => (
            <div key={inv.id} className="border rounded-md p-4 flex justify-between items-center">
              <div>
                <p className="font-mono font-semibold">{inv.invoiceNumber}</p>
                <p>{inv.date} {inv.customerName && `- ${inv.customerName}`}</p>
              </div>
              <div className="text-right">
                <p>₹{inv.total.toFixed(2)}</p>
                <Badge variant={inv.status === "Completed" ? "default" : "destructive"}>{inv.status}</Badge>
                {inv.status === "Completed" && (
                  <Button size="sm" variant="outline" onClick={() => handleReturn(inv.id)}>Return</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
