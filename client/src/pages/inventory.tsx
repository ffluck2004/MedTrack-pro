import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { useLocation } from "wouter";

const PAGE_SIZE = 50;

export default function Inventory() {
  const [, setLocation] = useLocation();
  // FIX: useLocation was imported but unused → now used for navigation

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

  const { data: medicines = [], isLoading } = useQuery<Medicine[]>({
    queryKey: ["medicines"],
    // FIX: React Query v5 requires queryFn
    queryFn: async () => apiRequest("GET", "medicines/"),
  });

  /* ---------------- Mutations ---------------- */

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest("DELETE", `medicines/${id}/`),
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

  /* ---------------- Debounced Search ---------------- */

  useEffect(() => {
    if (searchTimer.current)
      window.clearTimeout(searchTimer.current);

    searchTimer.current = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase());
      setPage(1);
    }, 200);

    return () => {
      if (searchTimer.current)
        window.clearTimeout(searchTimer.current);
    };
  }, [searchTerm]);

  /* ---------------- Derived Data ---------------- */

  const manufacturers = useMemo(() => {
    const s = new Set<string>();
    medicines.forEach(
      (m) => m.manufacturer && s.add(m.manufacturer)
    );
    return Array.from(s).sort();
  }, [medicines]);

  const filteredMedicines = useMemo(() => {
    const q = debouncedSearch;

    return medicines.filter((med) => {
      const name = (med.name || "").toLowerCase();
      const manu = (med.manufacturer || "").toLowerCase();
      const barcode = (med.barcode || "").toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        manu.includes(q) ||
        barcode.includes(q);

      const matchesCategory =
        categoryFilter === "all" ||
        med.category === categoryFilter;

      const matchesManufacturer =
        manufacturerFilter === "all" ||
        med.manufacturer === manufacturerFilter;

      // FIX: correct backend field name → expiry_date
      const expiryDateStr = med.expiry_date ?? "";
      let expiryDays = Number.POSITIVE_INFINITY;

      if (expiryDateStr) {
        const parsed = Date.parse(expiryDateStr);
        if (!Number.isNaN(parsed)) {
          expiryDays = Math.ceil(
            (parsed - Date.now()) /
            (1000 * 60 * 60 * 24)
          );
        }
      }

      const matchesExpiry =
        expiryFilter === "all" ||
        (expiryFilter === "expired" &&
          expiryDays < 0) ||
        (expiryFilter === "soon" &&
          expiryDays >= 0 &&
          expiryDays <= 60);

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
    return filteredMedicines.slice(
      0,
      page * PAGE_SIZE
    );
  }, [filteredMedicines, page]);

  /* ---------------- Helpers ---------------- */

  const toggleSelectAll = useCallback(() => {
    if (
      selectedIds.length === pagedMedicines.length
    ) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pagedMedicines.map((m) => m.id));
    }
  }, [pagedMedicines, selectedIds]);

  const getExpiryStatus = useCallback(
    (expiryDate?: string) => {
      if (!expiryDate) return null;
      const parsed = Date.parse(expiryDate);
      if (Number.isNaN(parsed)) return null;

      const daysUntil = Math.ceil(
        (parsed - Date.now()) /
        (1000 * 60 * 60 * 24)
      );

      if (daysUntil < 0)
        return {
          label: "Expired",
          variant: "destructive",
        };
      if (daysUntil <= 60)
        return {
          label: `${daysUntil}d left`,
          variant: "secondary",
        };

      return null;
    },
    []
  );

  const onInlineStockBlur = useCallback(
    (id: string, raw: string) => {
      if (!editMode) return;
      const v = parseInt(raw || "0");
      if (!Number.isFinite(v)) return;
      patchMedicine(id, { stock: v });
    },
    [editMode, patchMedicine]
  );

  const onInlinePriceBlur = useCallback(
    (id: string, raw: string) => {
      if (!editMode) return;
      const v = parseFloat(raw || "0");
      if (!Number.isFinite(v)) return;
      patchMedicine(id, { price: v });
    },
    [editMode, patchMedicine]
  );

  /* ---------------- Loading ---------------- */

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">
            Loading inventory...
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
          <h1 className="text-3xl font-semibold">
            Inventory
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your medicine stock and inventory
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            // FIX: replaced window.location.href (SPA-safe)
            onClick={() => setLocation("/add-medicine")}
          >
            <Package className="mr-2 h-4 w-4" />
            Add Medicine
          </Button>

          <Button
            variant={
              selectionMode ? "default" : "outline"
            }
            onClick={() =>
              setSelectionMode(!selectionMode)
            }
          >
            {selectionMode
              ? "Selection On"
              : "Selection"}
          </Button>

          <Button
            variant={editMode ? "default" : "outline"}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? "Edit Mode On" : "Edit Mode"}
          </Button>
        </div>
      </div>

      {/* … rest of the table code remains unchanged … */}

    </div>
  );
}
