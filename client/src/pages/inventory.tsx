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
import { Search, Edit, Trash2, Package, AlertTriangle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

/**
 * Inventory.tsx
 * - Selection mode (show checkboxes) toggled by "Selection" button
 * - Edit mode (show inline editable stock & price) toggled by "Edit" button
 * - Debounced search, memoized filters, simple pagination
 * - Expiry date guarded (no TS errors)
 */

const PAGE_SIZE = 50;

export default function Inventory() {
  const [, setLocation] = useLocation();

  // UI mode toggles
  const [selectionMode, setSelectionMode] = useState(false); // show checkboxes
  const [editMode, setEditMode] = useState(false); // show editable inputs

  // filters / search / pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("all");
  const [expiryFilter, setExpiryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // selection / delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // small ref to debounce search
  const searchTimer = useRef<number | null>(null);

  // Query medicines
  const { data: medicines = [], isLoading } = useQuery<Medicine[]>({
    queryKey: ["medicines"],
  });

  // Delete mutation
  // inside Inventory.tsx — update deleteMutation definition to this:
const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    // NOTE: apiRequest will NOT send a body for DELETE (see updated queryClient.ts)
    return apiRequest("DELETE", `medicines/${id}/`);
  },
  // variables param will be the id passed to mutate(...)
  onSuccess: (_data, id) => {
    // invalidate (force refetch) medicines list
    queryClient.invalidateQueries({ queryKey: ["medicines"] });

    // remove deleted id from selection and from any local UI state
    setSelectedIds((prev) => prev.filter((sid) => sid !== (id as string)));
    // clear modal id if it matches
    setDeleteId((curr) => (curr === id ? null : curr));
  },
  onError: (err) => {
    console.error("Delete failed:", err);
    // Add a toast or alert here if desired
  },
});


  // PATCH helper used by inline edit
  const patchMedicine = useCallback(async (id: string, payload: Partial<Medicine>) => {
    try {
      await apiRequest("PATCH", `medicines/${id}/`, payload);
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
    } catch (err) {
      console.error("Patch failed", err);
      // optionally show toast here (you probably already have a toast hook)
    }
  }, []);

  // debounce searchTerm -> debouncedSearch
  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    // small debounce for UI responsiveness
    searchTimer.current = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase());
      setPage(1); // reset pagination when search changes
    }, 200);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [searchTerm]);

  // computed manufacturers list
  const manufacturers = useMemo(() => {
    const s = new Set<string>();
    medicines.forEach((m) => {
      if (m.manufacturer) s.add(m.manufacturer);
    });
    return Array.from(s).sort();
  }, [medicines]);

  // filtered and memoized medicines
  const filteredMedicines = useMemo(() => {
    const q = debouncedSearch;
    return medicines.filter((med) => {
      // safe guards
      const name = (med.name || "").toLowerCase();
      const manu = (med.manufacturer || "").toLowerCase();
      const barcode = (med.barcode || "").toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        manu.includes(q) ||
        barcode.includes(q);

      const matchesCategory = categoryFilter === "all" || med.category === categoryFilter;
      const matchesManufacturer =
        manufacturerFilter === "all" || med.manufacturer === manufacturerFilter;

      // expiry guards: expiryDate may be null/undefined in some rows
      const expiryDateStr = med.expiryDate ?? "";
      let expiryDays = Number.POSITIVE_INFINITY;
      if (expiryDateStr) {
        const maybe = Date.parse(expiryDateStr);
        if (!Number.isNaN(maybe)) expiryDays = Math.ceil((maybe - Date.now()) / (1000 * 60 * 60 * 24));
      }

      const matchesExpiry =
        expiryFilter === "all" ||
        (expiryFilter === "expired" && expiryDays < 0) ||
        (expiryFilter === "soon" && expiryDays >= 0 && expiryDays <= 60);

      return matchesSearch && matchesCategory && matchesManufacturer && matchesExpiry;
    });
  }, [medicines, debouncedSearch, categoryFilter, manufacturerFilter, expiryFilter]);

  // pagination slice (keeps rendering light)
  const pagedMedicines = useMemo(() => {
    const end = page * PAGE_SIZE;
    return filteredMedicines.slice(0, end);
  }, [filteredMedicines, page]);

  // helper UI functions
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.length === pagedMedicines.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pagedMedicines.map((m) => m.id));
    }
  }, [pagedMedicines, selectedIds]);

  const getStockStatus = useCallback((stock: number) => {
    if (!Number.isFinite(stock)) return { label: "Unknown", variant: "default" as const };
    if (stock === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (stock <= 20) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  }, []);

  const getExpiryStatus = useCallback((expiryDate?: string) => {
    if (!expiryDate) return null;
    const parsed = Date.parse(expiryDate);
    if (Number.isNaN(parsed)) return null;
    const daysUntilExpiry = Math.ceil((parsed - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) return { label: "Expired", variant: "destructive" as const };
    if (daysUntilExpiry <= 60) return { label: `${daysUntilExpiry}d left`, variant: "secondary" as const };
    return null;
  }, []);

  // demo AI insights - placeholder for real Gemini integration
  const getAIInsights = useCallback((med: Medicine) => {
    // placeholder — user asked later how to integrate Gemini; see notes below
    alert(`AI Insights (demo) for ${med.name}\n\nThis is a placeholder. Replace with your AI call.`);
  }, []);

  // safety: don't allow accidental inline changes unless editMode is true
  const onInlineStockBlur = useCallback((id: string, raw: string) => {
    if (!editMode) return;
    const newVal = parseInt(raw || "0");
    if (!Number.isFinite(newVal)) return;
    patchMedicine(id, { stock: newVal } as any);
  }, [editMode, patchMedicine]);

  const onInlinePriceBlur = useCallback((id: string, raw: string) => {
    if (!editMode) return;
    const newVal = parseFloat(raw || "0");
    if (!Number.isFinite(newVal)) return;
    patchMedicine(id, { price: newVal } as any);
  }, [editMode, patchMedicine]);

  // batch delete handler
  const batchDelete = useCallback(() => {
    selectedIds.forEach((id) => {
      deleteMutation.mutate(id);
    });
    setSelectedIds([]);
    setSelectionMode(false);
  }, [selectedIds, deleteMutation]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your medicine stock and inventory</p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setLocation("/add-medicine")}>
            <Package className="mr-2 h-4 w-4" /> Add Medicine
          </Button>

          <Button variant={selectionMode ? "default" : "outline"} onClick={() => setSelectionMode((s) => !s)}>
            {selectionMode ? "Selection On" : "Selection"}
          </Button>

          <Button variant={editMode ? "default" : "outline"} onClick={() => setEditMode((e) => !e)}>
            {editMode ? "Edit Mode On" : "Edit Mode"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Type to search name / manufacturer / barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.values(Category).map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={manufacturerFilter} onValueChange={(v) => { setManufacturerFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Manufacturer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Manufacturers</SelectItem>
                {manufacturers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={expiryFilter} onValueChange={(v) => { setExpiryFilter(v); setPage(1); }}>
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

          {/* batch actions bar */}
          {selectionMode && selectedIds.length > 0 && (
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-muted-foreground">{selectedIds.length} selected</div>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={batchDelete}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {selectionMode ? (
                      <Checkbox
                        checked={selectedIds.length === pagedMedicines.length && pagedMedicines.length > 0}
                        onCheckedChange={(v) => toggleSelectAll()}
                      />
                    ) : <div style={{ width: 20 }} /> }
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
                  const expiryStatus = getExpiryStatus(medicine.expiryDate ?? undefined);
                  const stockStatus = getStockStatus(Number(medicine.stock ?? 0));
                  return (
                    <TableRow key={medicine.id}>
                      <TableCell>
                        {selectionMode ? (
                          <Checkbox
                            checked={selectedIds.includes(medicine.id)}
                            onCheckedChange={(v) =>
                              setSelectedIds((prev) => (v ? [...prev, medicine.id] : prev.filter((id) => id !== medicine.id)))
                            }
                          />
                        ) : (
                          <div style={{ width: 20 }} />
                        )}
                      </TableCell>

                      <TableCell className="font-medium">{medicine.name}</TableCell>
                      <TableCell className="text-muted-foreground">{medicine.manufacturer}</TableCell>
                      <TableCell><Badge variant="outline">{medicine.category}</Badge></TableCell>

                      <TableCell className="text-right">
                        {editMode ? (
                          <Input
                            type="number"
                            defaultValue={medicine.stock ?? 0}
                            onBlur={(e) => onInlineStockBlur(medicine.id, e.target.value)}
                            className="w-24 text-right"
                          />
                        ) : (
                          <div className="font-mono">{medicine.stock ?? 0}</div>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {editMode ? (
                          <Input
                            type="number"
                            step="0.01"
                            defaultValue={medicine.price ?? 0}
                            onBlur={(e) => onInlinePriceBlur(medicine.id, e.target.value)}
                            className="w-28 text-right"
                          />
                        ) : (
                          <div className="font-mono">₹{Number(medicine.price ?? 0).toFixed(2)}</div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {medicine.expiryDate ?? "-"}
                          {expiryStatus && <Badge variant={expiryStatus.variant}>{expiryStatus.label}</Badge>}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                      </TableCell>

                      <TableCell className="text-right flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => getAIInsights(medicine)}>
                          <AlertTriangle className="h-4 w-4 mr-1" /> AI
                        </Button>

                        <Button variant="ghost" size="icon" onClick={() => setLocation(`/edit-medicine/${medicine.id}`)}>
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(medicine.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {pagedMedicines.length} of {filteredMedicines.length} filtered — total {medicines.length}
            </div>

            <div className="flex gap-2">
              {page * PAGE_SIZE < filteredMedicines.length && (
                <Button onClick={() => setPage((p) => p + 1)}>Load more</Button>
              )}
              {page > 1 && <Button variant="outline" onClick={() => { setPage(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Reset</Button>}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medicine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this medicine? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
             onClick={() => {
              if (deleteId) {
               deleteMutation.mutate(deleteId);
             }
              }}
                    >
              Delete
          </AlertDialogAction>

          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
