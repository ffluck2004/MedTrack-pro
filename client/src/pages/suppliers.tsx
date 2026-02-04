import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Supplier, insertSupplierSchema } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Search, Plus, Edit, Trash2, Truck } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Suppliers() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] =
    useState<Supplier | null>(null);

  /* ---------------- Query ---------------- */

  const { data: suppliers = [], isLoading } =
    useQuery<Supplier[]>({
      queryKey: ["/api/suppliers"],
      // FIX: React Query v5 requires explicit queryFn
      queryFn: async () =>
        apiRequest("GET", "/api/suppliers"),
    });

  /* ---------------- Form ---------------- */

  const form = useForm({
    resolver: zodResolver(insertSupplierSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
    },
  });

  /* ---------------- Mutations ---------------- */

  const createMutation = useMutation({
    mutationFn: async (data: any) =>
      apiRequest("POST", "/api/suppliers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/suppliers"],
      });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Supplier added successfully",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: any;
    }) =>
      apiRequest(
        "PATCH",
        `/api/suppliers/${id}`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/suppliers"],
      });
      setIsDialogOpen(false);
      setEditingSupplier(null);
      form.reset();
      toast({
        title: "Success",
        description: "Supplier updated successfully",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest(
        "DELETE",
        `/api/suppliers/${id}`,
        {}
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/suppliers"],
      });
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
    },
  });

  /* ---------------- Derived Data ---------------- */

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      s.contactPerson
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      s.email
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  /* ---------------- Handlers ---------------- */

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      form.reset(supplier);
    } else {
      setEditingSupplier(null);
      form.reset({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = (data: any) => {
    if (editingSupplier) {
      updateMutation.mutate({
        id: editingSupplier.id,
        data,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  /* ---------------- Loading ---------------- */

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">
            Loading suppliers...
          </p>
        </div>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            Suppliers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage supplier information
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="pl-10"
            />
          </div>

          {filteredSuppliers.length === 0 ? (
            <div className="py-12 text-center">
              <Truck className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground">
                No suppliers found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {suppliers.length === 0
                  ? "Add your first supplier to get started"
                  : "Try adjusting your search"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Company Name
                    </TableHead>
                    <TableHead>
                      Contact Person
                    </TableHead>
                    <TableHead>
                      Phone
                    </TableHead>
                    <TableHead>
                      Email
                    </TableHead>
                    <TableHead className="text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">
                        {supplier.name}
                      </TableCell>
                      <TableCell>
                        {supplier.contactPerson}
                      </TableCell>
                      <TableCell className="font-mono">
                        {supplier.phone}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {supplier.email}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleOpenDialog(supplier)
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              deleteMutation.mutate(
                                supplier.id
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSupplier
                ? "Edit Supplier"
                : "Add New Supplier"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Company Name *
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Contact Person *
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setIsDialogOpen(false)
                  }
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending ||
                    updateMutation.isPending
                  }
                >
                  {editingSupplier ? "Update" : "Add"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
