import { useQuery } from "@tanstack/react-query";
import { PurchaseOrder, Supplier } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
// FIX: apiRequest imported to provide queryFn (React Query v5 requirement)

export default function PurchaseOrders() {
  const {
    data: purchaseOrders = [],
    isLoading: ordersLoading,
  } = useQuery<PurchaseOrder[]>({
    queryKey: ["/api/purchase-orders"],
    // FIX: React Query v5 requires queryFn
    queryFn: async () =>
      apiRequest("GET", "/api/purchase-orders"),
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
    // FIX: React Query v5 requires queryFn
    queryFn: async () =>
      apiRequest("GET", "/api/suppliers"),
  });

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(
      (s) => s.id === supplierId
    );
    return supplier?.name || "Unknown Supplier";
  };

  if (ordersLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">
            Loading purchase orders...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">
          Purchase Orders
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track orders from suppliers
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          {purchaseOrders.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground">
                No purchase orders
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Purchase orders will appear here when created
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">
                      PO Number
                    </TableHead>
                    <TableHead className="font-semibold">
                      Supplier
                    </TableHead>
                    <TableHead className="font-semibold">
                      Date
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      Total Amount
                    </TableHead>
                    <TableHead className="font-semibold">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono font-semibold">
                        {po.poNumber}
                      </TableCell>
                      <TableCell>
                        {getSupplierName(po.supplierId)}
                      </TableCell>
                      <TableCell>{po.date}</TableCell>
                      <TableCell className="text-right font-mono">
                        ₹
                        {Number(po.totalAmount).toFixed(
                          2
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          // FIX: Badge variant kept union-safe
                          variant={
                            po.status === "Completed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {po.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
