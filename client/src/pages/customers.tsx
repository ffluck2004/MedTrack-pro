import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search, Users } from "lucide-react";

export default function Customers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  /* ---------------- FETCH ---------------- */

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => apiRequest("GET", "customers/"),
  });

  /* ---------------- DELETE ---------------- */

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `customers/${id}/`), // ✅ TRAILING SLASH FIXED
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] }); // ✅ MATCHED KEY
    },
    onError: (error) => {
      console.error("Delete failed:", error);
      alert("Unable to delete customer.");
    },
  });

  const handleDelete = (id: number) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this customer?"
    );
    if (!confirmDelete) return;

    deleteMutation.mutate(id);
  };

  /* ---------------- FILTER ---------------- */

  const filteredCustomers = customers.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  /* ---------------- LOADING ---------------- */

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-r-transparent rounded-full" />
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Manage customer records
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                No customers found
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredCustomers.map((customer: any) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        {customer.name}
                      </TableCell>
                      <TableCell>
                        {customer.contact || "-"}
                      </TableCell>
                      <TableCell>
                        {customer.email || "-"}
                      </TableCell>
                      <TableCell>
                        {customer.address || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleDelete(customer.id)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
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