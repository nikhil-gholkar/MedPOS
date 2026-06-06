import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Chip,
  TextField,
  InputAdornment,
  Skeleton,
} from "@mui/material";
import {
  Add,
  Search,
  Medication,
  Inventory2,
  Warning,
} from "@mui/icons-material";
import MedicineFormDialog from "../../features/inventory/MedicineFormDialog";
import MedicineDetailsDialog from "../../features/inventory/MedicineDetailsDialog";
import {
  createMedicine,
  getMedicines,
} from "../../features/inventory/inventoryService";
import { useAppSelector } from "../../hooks/reduxHooks";
import type {
  CreateMedicinePayload,
  Medicine,
  MedicineCategory,
} from "../../features/inventory/inventoryTypes";

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  Tablet: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Capsule: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  Syrup: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Injection: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  Other: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
};

function getExpiryStatus(expiryDate: string) {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: "Expired", color: "bg-red-100 text-red-700" };
  if (daysLeft <= 30) return { label: "Near Expiry", color: "bg-amber-100 text-amber-700" };
  if (daysLeft <= 90) return { label: "Expiring Soon", color: "bg-orange-100 text-orange-700" };
  return { label: "Valid", color: "bg-emerald-100 text-emerald-700" };
}

function getStockStatus(quantity: number) {
  if (quantity <= 0) return { label: "Out of Stock", color: "bg-red-100 text-red-700" };
  if (quantity <= 10) return { label: "Low Stock", color: "bg-amber-100 text-amber-700" };
  return { label: "In Stock", color: "bg-emerald-100 text-emerald-700" };
}

export default function InventoryPage() {
  const user = useAppSelector((state) => state.auth.user);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | MedicineCategory>("All");

  const loadMedicines = async () => {
    const medicalId = user?.medicalId;
    if (!medicalId) return;
    try {
      setLoading(true);
      const data = await getMedicines(medicalId);
      setMedicines(data);
    } catch (error) {
      console.error("Error loading medicines:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, [user]);

  const handleAddMedicine = async (medicineData: CreateMedicinePayload) => {
    const medicalId = user?.medicalId;
    if (!medicalId) return;
    try {
      await createMedicine(medicalId, medicineData);
      await loadMedicines();
      setDialogOpen(false);
    } catch (error) {
      console.error("Error adding medicine:", error);
    }
  };

  const filteredMedicines = useMemo(() => {
    return medicines.filter((medicine) => {
      const matchesSearch =
        medicine.medicineName.toLowerCase().includes(search.toLowerCase()) ||
        medicine.genericName.toLowerCase().includes(search.toLowerCase()) ||
        medicine.manufacturer.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "All" ? true : medicine.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [medicines, search, selectedCategory]);

  const categories: ("All" | MedicineCategory)[] = [
    "All", "Tablet", "Capsule", "Syrup", "Injection", "Other",
  ];

  const totalValue = filteredMedicines.reduce((sum, m) => sum + m.sellingPrice * m.quantity, 0);
  const lowStockCount = filteredMedicines.filter((m) => m.quantity <= 10).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventory</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your medicine stock</p>
        </div>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
          sx={{
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            py: 1.5,
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
            background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
            transition: "all 0.2s",
            "&:hover": {
              boxShadow: "0 6px 20px rgba(37, 99, 235, 0.4)",
              transform: "translateY(-1px)",
            },
          }}
        >
          Add Medicine
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Inventory2 sx={{ fontSize: 20, color: "#2563EB" }} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Items</p>
              <p className="text-xl font-bold text-slate-900">{filteredMedicines.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Medication sx={{ fontSize: 20, color: "#059669" }} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Value</p>
              <p className="text-xl font-bold text-slate-900">₹{totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Warning sx={{ fontSize: 20, color: "#D97706" }} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Low Stock</p>
              <p className="text-xl font-bold text-slate-900">{lowStockCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <TextField
            fullWidth
            placeholder="Search medicines by name, generic, or manufacturer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "#94A3B8" }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                backgroundColor: "#F8FAFC",
                "& fieldset": { borderColor: "#E2E8F0" },
                "&:hover fieldset": { borderColor: "#CBD5E1" },
                "&.Mui-focused fieldset": { borderColor: "#2563EB" },
              },
            }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <Chip
                key={category}
                label={category}
                clickable
                onClick={() => setSelectedCategory(category)}
                sx={{
                  borderRadius: "8px",
                  fontWeight: isActive ? 600 : 500,
                  backgroundColor: isActive ? "#2563EB" : "#F1F5F9",
                  color: isActive ? "white" : "#64748B",
                  border: "1px solid",
                  borderColor: isActive ? "#2563EB" : "#E2E8F0",
                  transition: "all 0.2s",
                  "&:hover": {
                    backgroundColor: isActive ? "#1D4ED8" : "#E2E8F0",
                  },
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={200} sx={{ borderRadius: "16px" }} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredMedicines.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white py-16 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
            <Medication sx={{ fontSize: 32, color: "#CBD5E1" }} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No Medicines Found</h3>
          <p className="mt-2 max-w-sm text-center text-sm text-slate-500">
            {search
              ? "No medicines match your search. Try adjusting your filters."
              : "Add your first medicine to start managing your inventory."}
          </p>
          {!search && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setDialogOpen(true)}
              sx={{
                mt: 3,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 600,
                background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
              }}
            >
              Add Medicine
            </Button>
          )}
        </div>
      )}

      {/* Medicine Cards */}
      {!loading && filteredMedicines.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMedicines.map((medicine) => {
            const expiryStatus = getExpiryStatus(medicine.expiryDate);
            const stockStatus = getStockStatus(medicine.quantity);
            const catStyle = categoryColors[medicine.category] || categoryColors.Other;
            const profit = medicine.sellingPrice - medicine.purchasePrice;

            return (
              <div
                key={medicine.id}
                className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                onClick={() => {
                  setSelectedMedicine(medicine);
                  setDetailsOpen(true);
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {medicine.medicineName}
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-500">{medicine.genericName}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                    {medicine.category}
                  </span>
                </div>

                {/* Divider */}
                <div className="my-3 border-t border-slate-100" />

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400">Quantity</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {medicine.quantity}
                      <span className={`ml-2 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Selling Price</p>
                    <p className="text-sm font-semibold text-slate-900">₹{medicine.sellingPrice}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Batch</p>
                    <p className="text-sm font-semibold text-slate-900">{medicine.batchNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Expiry</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-slate-900">
                        {new Date(medicine.expiryDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                      </p>
                      <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${expiryStatus.color}`}>
                        {expiryStatus.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Profit/Unit</p>
                    <p className={`text-sm font-bold ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      ₹{profit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Manufacturer</p>
                    <p className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                      {medicine.manufacturer || "-"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MedicineFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleAddMedicine}
      />
      <MedicineDetailsDialog
        open={detailsOpen}
        medicine={selectedMedicine}
        onClose={() => setDetailsOpen(false)}
        onUpdated={loadMedicines}
      />
    </div>
  );
}
