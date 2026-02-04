import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ---------------- Types ---------------- */

// FIX: Props, Invoice, Medicine types were missing → added for TS safety
interface InvoiceItem {
  medicineId: string;
  quantity: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName?: string;
  date: string;
  total: number;
  status: "Completed" | "Returned";
  items: InvoiceItem[];
}

interface Medicine {
  id: string;
  stock: number;
}

interface Props {
  invoices: Invoice[];
  medicines: Medicine[];
  setMedicines: (m: Medicine[]) => void;
  onReturn: (updatedInvoices: Invoice[]) => void;
}

/* ---------------- Component ---------------- */

export default function InvoiceHistoryView({
  invoices,
  onReturn,
  medicines,
  setMedicines,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = invoices.filter(
    (i) =>
      i.invoiceNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (i.customerName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      )
  );

  const handleReturn = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv || inv.status === "Returned") return;

    const updated = invoices.map((i) =>
      i.id === id ? { ...i, status: "Returned" } : i
    );

    // Restock logic (unchanged)
    const restocked = medicines.map((m) => {
      const item = inv.items.find(
        (x) => x.medicineId === m.id
      );
      return item
        ? { ...m, stock: m.stock + item.quantity }
        : m;
    });

    setMedicines(restocked);
    onReturn(updated);
  };

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>Invoice History</CardTitle>
        <Input
          placeholder="Search invoice or customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </CardHeader>

      <CardContent>
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {filtered.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-md border p-4"
            >
              <div>
                <p className="font-mono font-semibold">
                  {inv.invoiceNumber}
                </p>
                <p className="text-sm text-muted-foreground">
                  {inv.date}
                  {inv.customerName &&
                    ` - ${inv.customerName}`}
                </p>
              </div>

              <div className="text-right space-y-1">
                <p className="font-medium">
                  ₹{inv.total.toFixed(2)}
                </p>

                <Badge
                  // FIX: Badge variant union now type-safe
                  variant={
                    inv.status === "Completed"
                      ? "default"
                      : "destructive"
                  }
                >
                  {inv.status}
                </Badge>

                {inv.status === "Completed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleReturn(inv.id)
                    }
                  >
                    Return
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
