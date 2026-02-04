import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Medicine, Category } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Edit, Trash2, Package } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

const PAGE_SIZE = 50;

export default function Inventory() {
  const [selectionMode, setSelectionMode] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("all");
  const [expiryFilter, setExpiryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const searchTimer = useRef<number | null>(null);

  /* =========================================================
     ✅ FIX #1 (CRITICAL)
     Inventory was using a queryKey without an explicit fetcher.
     That caused it to hit the wrong backend.
     
     Now Inventory ALWAYS fetches from:
     GET /api/medicines  (same as Billing)
  ========================================================= */
  const { data: medicines = [], isLoading } = useQuery<Medicine[]>({
    queryKey: ["medicines"],
    queryFn: async () => {
      // IMPORTANT: This uses the same apiRequest used everywhere
      return await apiRequest("GET", "medicines/");
    },
  });

  /* =========================================================
     DELETE mutation
  ========================================================= */
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `medicines/${id}/`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
      setDeleteId((curr) => (curr === id ? null : curr));
    },
  });

  const patchMedicine = useCallback(
    async (id: string, payload: Partial<Medicine>) => {
      try {
        await apiRequest("PATCH", `medicines/${id}/`, payload);
        queryClient.invalidateQueries({ queryKey: ["medicines"] });
      } catch (err) {
        console.error("Patch failed", err);
      }
    },
    []
  );

  /* =========================================================
     Search debounce
  ========================================================= */
  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase());
      setPage(1);
    }, 200);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [searchTerm]);

  const manufacturers = useMemo(() => {
    const s = new Set<string>();
    medicines.forEach((m) => m.manufacturer && s.add(m.manufacturer));
    return Array.from(s).sort();
  }, [medicines]);

  /* =========================================================
     Filtering
  ========================================================= */
  const filteredMedicines = useMemo(() => {
    const q = debouncedSearch;

    return medicines.filter((med) => {
      const name = (med.name || "").toLowerCase();
      const manu = (med.manufacturer || "").toLowerCase();
      const barcode = (med.barcode || "").toLowerCase();

      const matchesSearch =
        !q || name.includes(q) || manu.includes(q) || barcode.includes(q);

      const matchesCategory =
        categoryFilter === "all" || med.category === categoryFilter;

      const matchesManufacturer =
        manufacturerFilter === "all" || med.manufacturer === manufacturerFilter;

      // Works for both expiry_date and expiryDate depending on backend
      const expiryDateStr =
        (med as any).expiry_date ?? (med as any).expiryDate ?? "";

      let expiryDays = Number.POSITIVE_INFINITY;

      if (expiryDateStr) {
        const parsed = Date.parse(expiryDateStr);
        if (!Number.isNaN(parsed)) {
          expiryDays = Math.ceil((parsed - Date.now()) / (1000 * 60 * 60 * 24));
        }
      }

      const matchesExpiry =
        expiryFilter === "all" ||
        (expiryFilter === "expired" && expiryDays < 0) ||
        (expiryFilter === "soon" && expiryDays >= 0 && expiryDays <= 60);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesManufacturer &&
        matchesExpiry
      );
    });
  }, [
    medicines,
    debouncedSearch,
    categoryFilter,
    manufacturerFilter,
    expiryFilter,
  ]);

  const pagedMedicines = useMemo(() => {
    const end = page * PAGE_SIZE;
    return filteredMedicines.slice(0, end);
  }, [filteredMedicines, page]);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.length === pagedMedicines.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pagedMedicines.map((m) => m.id));
    }
  }, [pagedMedicines, selectedIds]);

  /* =========================================================
     Expiry badge logic
  ========================================================= */
  const getExpiryStatus = useCallback((expiryDate?: string) => {
    if (!expiryDate) return null;
    const parsed = Date.parse(expiryDate);
    if (Number.isNaN(parsed)) return null;

    const daysUntil = Math.ceil((parsed - Date.now()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return { label: "Expired", variant: "destructive" };
    if (daysUntil <= 60)
      return { label: `${daysUntil}d left`, variant: "secondary" };

    return null;
  }, []);

  const onInlineStockBlur = useCallback(
    (id: string, raw: string) => {
      if (!editMode) return;
      const v = parseInt(raw || "0");
      if (!Number.isFinite(v)) return;
      patchMedicine(id, { stock: v } as any);
    },
    [editMode, patchMedicine]
  );

  const onInlinePriceBlur = useCallback(
    (id: string, raw: string) => {
      if (!editMode) return;
      const v = parseFloat(raw || "0");
      if (!Number.isFinite(v)) return;
      patchMedicine(id, { price: v } as any);
    },
    [editMode, patchMedicine]
  );

  const batchDelete = useCallback(() => {
    selectedIds.forEach((id) => deleteMutation.mutate(id));
    setSelectedIds([]);
    setSelectionMode(false);
  }, [selectedIds, deleteMutation]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">
            Loading inventory...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Manage your medicine stock and inventory
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => (window.location.href = "/add-medicine")}>
            <Package className="mr-2 h-4 w-4" /> Add Medicine
          </Button>

          <Button
            variant={selectionMode ? "default" : "outline"}
            onClick={() => setSelectionMode(!selectionMode)}
          >
            {selectionMode ? "Selection On" : "Selection"}
          </Button>

          <Button
            variant={editMode ? "default" : "outline"}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? "Edit Mode On" : "Edit Mode"}
          </Button>

          {selectionMode && selectedIds.length > 0 && (
            <Button variant="destructive" onClick={batchDelete}>
              Delete Selected ({selectedIds.length})
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Type to search name / manufacturer / barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.values(Category).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={manufacturerFilter}
              onValueChange={(v) => setManufacturerFilter(v)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Manufacturer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Manufacturers</SelectItem>
                {manufacturers.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={expiryFilter} onValueChange={(v) => setExpiryFilter(v)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Expiry Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="soon">Expiring Soon (≤60d)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {selectionMode ? (
                      <Checkbox
                        checked={
                          selectedIds.length === pagedMedicines.length &&
                          pagedMedicines.length > 0
                        }
                        onCheckedChange={() => toggleSelectAll()}
                      />
                    ) : (
                      <div style={{ width: 20 }} />
                    )}
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {pagedMedicines.map((medicine) => {
                  const expiryRaw =
                    (medicine as any).expiry_date ?? (medicine as any).expiryDate;

                  const formattedExpiry = expiryRaw
                    ? new Date(expiryRaw).toLocaleDateString("en-GB")
                    : "-";

                  const expiryStatus = getExpiryStatus(expiryRaw ?? undefined);

                  const stockStatus = {
                    label:
                      medicine.stock === 0
                        ? "Out of Stock"
                        : medicine.stock <= 20
                          ? "Low Stock"
                          : "In Stock",
                    variant:
                      medicine.stock === 0
                        ? "destructive"
                        : medicine.stock <= 20
                          ? "secondary"
                          : "default",
                  };

                  return (
                    <TableRow key={medicine.id}>
                      <TableCell>
                        {selectionMode ? (
                          <Checkbox
                            checked={selectedIds.includes(medicine.id)}
                            onCheckedChange={(v) =>
                              setSelectedIds((prev) =>
                                v
                                  ? [...prev, medicine.id]
                                  : prev.filter((id) => id !== medicine.id)
                              )
                            }
                          />
                        ) : (
                          <div style={{ width: 20 }} />
                        )}
                      </TableCell>

                      <TableCell className="font-medium">
                        {medicine.name}
                      </TableCell>
                      <TableCell>{medicine.manufacturer}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{medicine.category}</Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        {editMode ? (
                          <Input
                            type="number"
                            defaultValue={medicine.stock}
                            onBlur={(e) =>
                              onInlineStockBlur(medicine.id, e.target.value)
                            }
                            className="w-24 text-right"
                          />
                        ) : (
                          <span>{medicine.stock}</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {editMode ? (
                          <Input
                            type="number"
                            step="0.01"
                            defaultValue={medicine.price}
                            onBlur={(e) =>
                              onInlinePriceBlur(medicine.id, e.target.value)
                            }
                            className="w-24 text-right"
                          />
                        ) : (
                          <span>₹{Number(medicine.price).toFixed(2)}</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {formattedExpiry}
                          {expiryStatus && (
                            <Badge variant={expiryStatus.variant as any}>
                              {expiryStatus.label}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={stockStatus.variant as any}>
                          {stockStatus.label}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            (window.location.href = `/edit-medicine/${medicine.id}`)
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(medicine.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {pagedMedicines.length} of {filteredMedicines.length} filtered
              — total {medicines.length}
            </div>

            {page * PAGE_SIZE < filteredMedicines.length && (
              <Button onClick={() => setPage((p) => p + 1)}>Load More</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medicine</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure you want to delete this
              medicine?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
