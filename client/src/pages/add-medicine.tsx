import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Medicine, Category, insertMedicineSchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useRoute } from "wouter";
import { ArrowLeft, Save, Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";



// ----------------------------------------------------
// ✅ Date Normalizer — FIXES your 400 error
// Converts DD/MM/YYYY → YYYY-MM-DD
// Converts DD-MM-YYYY → YYYY-MM-DD
// Converts Excel numeric dates → YYYY-MM-DD
// ----------------------------------------------------
function normalizeDate(dateStr: any) {
  if (!dateStr) return undefined;

  const value = String(dateStr).trim();

  // Excel numeric date (e.g., 45231)
  if (!isNaN(Number(value))) {
    const excelEpoch = new Date(1899, 11, 30);
    const dateObj = new Date(excelEpoch.getTime() + Number(value) * 86400000);
    return dateObj.toISOString().split("T")[0];
  }

  // DD/MM/YYYY
  if (value.includes("/")) {
    const [dd, mm, yyyy] = value.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }

  // DD-MM-YYYY
  if (value.includes("-")) {
    const [dd, mm, yyyy] = value.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }

  return value; // fallback
}


// ----------------------------------------------------
// Schema Setup
// ----------------------------------------------------
const formSchema = insertMedicineSchema.extend({
  price: z.string().min(1, "Price is required"),
  cost: z.string().min(1, "Cost is required"),
  stock: z.string().min(1, "Stock is required"),
  expiry_date: z.string().min(1, "Expiry date is required"),
});

type FormValues = z.infer<typeof formSchema>;


// ----------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------
export default function AddMedicine() {
  const [, setLocation] = useLocation();
  const [isEdit, params] = useRoute("/edit-medicine/:id");
  const { toast } = useToast();
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);


  // Fetch Medicine for Edit Mode
  const { data: medicine } = useQuery<Medicine>({
    queryKey: ["medicines", params?.id],
    queryFn: async () => {
      const res = await fetch(`http://127.0.0.1:8000/api/medicines/${params?.id}/`);
      if (!res.ok) throw new Error("Failed to fetch medicine");
      return res.json();
    },
    enabled: isEdit && !!params?.id,
  });


  // Form Setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      manufacturer: "",
      category: Category.OTHER,
      stock: "0",
      expiry_date: "",
      barcode: "",
      price: "",
      cost: "",
    },
  });

  useEffect(() => {
    if (medicine) {
      form.reset({
        name: medicine.name,
        manufacturer: medicine.manufacturer,
        category: medicine.category,
        stock: medicine.stock.toString(),
        expiry_date: medicine.expiry_date,
        barcode: medicine.barcode,
        price: medicine.price.toString(),
        cost: medicine.cost.toString(),
      });
    }
  }, [medicine, form]);


  // ----------------------------------------------------
  // EXCEL IMPORT — FIXED VERSION
  // ----------------------------------------------------
  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const newMedicines = rows.map((row: any) => ({
        name: String(row.name ?? "").trim(),
        manufacturer: String(row.manufacturer ?? "").trim(),
        category: String(row.category ?? "Other").trim(),
        stock: String(Math.max(0, Number(row.stock) || 0)),
        expiry_date: normalizeDate(row.expiry_date),   // ✅ FIX APPLIED
        barcode: row.barcode ? String(row.barcode).trim() : undefined,
        price: String(Number(row.price) || 0),
        cost: String(Number(row.cost) || 0),
      }));

      for (const med of newMedicines) {
        await apiRequest("POST", "medicines/", med);
      }

      queryClient.invalidateQueries({ queryKey: ["medicines"] });

      toast({
        title: "Excel Imported",
        description: `${newMedicines.length} medicines added successfully.`,
      });

    } catch (error: any) {
      console.error("Excel import failed:", error);
      toast({
        title: "Import Failed",
        description: error?.message ?? "Unknown error",
        variant: "destructive",
      });
    }
  };


  // ----------------------------------------------------
  // CREATE MEDICINE
  // ----------------------------------------------------
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) =>
      apiRequest("POST", "medicines/", {
        ...data,
        category: data.category,
        price: parseFloat(data.price),
        cost: parseFloat(data.cost),
        stock: parseInt(data.stock),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      form.reset();
      toast({ title: "Success", description: "Medicine added successfully" });
      setLocation("/login");
    },

    onError: (error: Error) => {
      toast({
        title: "Error Adding Medicine",
        description: error.message,
        variant: "destructive",
      });
    },
  });


  // ----------------------------------------------------
  // UPDATE MEDICINE
  // ----------------------------------------------------
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) =>
      apiRequest("PATCH", `medicines/${params?.id}/`, {
        ...data,
        category: data.category,
        price: parseFloat(data.price),
        cost: parseFloat(data.cost),
        stock: parseInt(data.stock),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      form.reset();
      toast({ title: "Updated", description: "Medicine updated successfully" });
      setLocation("/inventory");
    },

    onError: (error: Error) => {
      toast({
        title: "Error Updating Medicine",
        description: error.message,
        variant: "destructive",
      });
    },
  });


  const onSubmit = (data: FormValues) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;


  // ----------------------------------------------------
  // Camera Barcode Logic (unchanged)
  // ----------------------------------------------------
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setShowScanner(true);
    } catch {
      toast({
        title: "Camera Error",
        description: "Unable to access camera.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setShowScanner(false);
  };

  const captureBarcode = () => {
    const randomBarcode = `890${Math.floor(Math.random() * 10000000000)}`;
    form.setValue("barcode", randomBarcode);
    toast({ title: "Barcode Captured", description: `Generated: ${randomBarcode}` });
    stopCamera();
  };


  // ----------------------------------------------------
  // UI
  // ----------------------------------------------------
  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => (setLocation("/inventory"))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div>
          <h1 className="text-3xl font-semibold">
            {isEdit ? "Edit Medicine" : "Add New Medicine"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEdit ? "Update medicine information" : "Add a new medicine to your inventory"}
          </p>
        </div>
      </div>

      {/* Card */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Medicine Information</CardTitle>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              id="excelUpload"
              className="hidden"
              onChange={handleExcelUpload}
            />
            <Button variant="outline" onClick={() => document.getElementById("excelUpload")?.click()}>
              Upload Excel File
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Form Fields */}
              <div className="grid gap-6 md:grid-cols-2">

                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medicine Name *</FormLabel>
                    <FormControl><Input placeholder="e.g., Paracetamol 500mg" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="manufacturer" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer *</FormLabel>
                    <FormControl><Input placeholder="e.g., Cipla Ltd." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(Category).map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="stock" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity *</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Price (₹) *</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormDescription>Price per unit</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="cost" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Price (₹) *</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormDescription>Purchase cost per unit</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="expiry_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date *</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="barcode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode *</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="Scan or enter barcode" {...field} />
                        <Button type="button" variant="outline" size="icon" onClick={startCamera}>
                          <Camera className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => (setLocation("/inventory"))}
                  disabled={isPending}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {isPending ? "Saving..." : isEdit ? "Update Medicine" : "Add Medicine"}
                </Button>
              </div>

            </form>
          </Form>
        </CardContent>
      </Card>


      {/* Barcode Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Scan Barcode
              <Button variant="ghost" size="icon" onClick={stopCamera}><X className="h-4 w-4" /></Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-md overflow-hidden">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-32 border-2 border-primary rounded-md"></div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Position the barcode within the frame
            </p>
            <div className="flex gap-2">
              <Button onClick={captureBarcode} className="flex-1">
                <Camera className="mr-2 h-4 w-4" /> Capture Barcode
              </Button>
              <Button onClick={stopCamera} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
