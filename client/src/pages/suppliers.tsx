import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Suppliers() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [touched, setTouched] = useState(false);

  const [form, setForm] = useState({
    name: "",
    contact: "",
    email: "",
    address: "",
    gst_number: "",
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => apiRequest("GET", "suppliers/"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "suppliers/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) =>
      apiRequest("PATCH", `suppliers/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `suppliers/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
    setTouched(false);
    setForm({
      name: "",
      contact: "",
      email: "",
      address: "",
      gst_number: "",
    });
  };

  const openDialog = (supplier?: any) => {
    if (supplier) {
      setEditing(supplier);
      setForm(supplier);
    }
    setOpen(true);
  };

  const errors: any = {};

  if (touched) {
    if (!form.name.trim()) errors.name = "Company name required";

    if (!form.contact.trim())
      errors.contact = "Phone required";
    else if (!/^[0-9]{10}$/.test(form.contact))
      errors.contact = "Phone must be 10 digits";

    if (!form.email.trim())
      errors.email = "Email required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      errors.email = "Invalid email";

    if (form.gst_number && !/^[A-Za-z0-9]{15}$/.test(form.gst_number))
      errors.gst_number = "GST must be 15 characters";
  }

  const handleSubmit = () => {
    setTouched(true);
    if (Object.keys(errors).length > 0) return;

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filtered = suppliers.filter((s: any) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-semibold">Suppliers</h1>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Input
            placeholder="Search supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4"
          />

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.contact}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.gst_number}</TableCell>
                    <TableCell>{s.address}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openDialog(s)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          deleteMutation.mutate(s.id)
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
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Supplier" : "Add Supplier"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              placeholder="Company Name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">
                {errors.name}
              </p>
            )}

            <Input
              placeholder="Phone (10 digits)"
              value={form.contact}
              onChange={(e) =>
                setForm({ ...form, contact: e.target.value })
              }
              className={errors.contact ? "border-red-500" : ""}
            />
            {errors.contact && (
              <p className="text-red-500 text-sm">
                {errors.contact}
              </p>
            )}

            <Input
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">
                {errors.email}
              </p>
            )}

            <Input
              placeholder="GST (15 characters)"
              value={form.gst_number}
              onChange={(e) =>
                setForm({ ...form, gst_number: e.target.value })
              }
              className={
                errors.gst_number ? "border-red-500" : ""
              }
            />
            {errors.gst_number && (
              <p className="text-red-500 text-sm">
                {errors.gst_number}
              </p>
            )}

            <Input
              placeholder="Address"
              value={form.address}
              onChange={(e) =>
                setForm({ ...form, address: e.target.value })
              }
            />

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editing ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}