import { useCallback, useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import {
  Button,
  InputAdornment,
  Skeleton,
  TextField,
} from "@mui/material";
import {
  Add,
  Search,
  ChevronRight,
  Medication,
} from "@mui/icons-material";

import MedicineFormDialog from "../../features/inventory/MedicineFormDialog";
import MedicineDetailsDialog from "../../features/inventory/MedicineDetailsDialog";
import {
  createMedicine,
  getMedicines,
} from "../../features/inventory/inventoryService";
import {
  MEDICINE_CATEGORIES,
} from "../../features/inventory/categoryMeta";
import { useAppSelector } from "../../hooks/reduxHooks";

import PageHeader from "../../components/ui/PageHeader";
import StatsCard from "../../components/ui/StatsCard";
import StatsStrip from "../../components/ui/StatsStrip";

import type {
  CreateMedicinePayload,
  Medicine,
  MedicineCategory,
} from "../../features/inventory/inventoryTypes";

const TAG = "inline-flex items-center rounded-chip border px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap";

function getExpiryStatus(expiryDate: string) {
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return { label: "Expired", className: `${TAG} border-danger/25 bg-danger-soft text-danger` };
  }
  if (daysLeft <= 30) {
    return { label: "Near expiry", className: `${TAG} border-warn/25 bg-warn-soft text-warn` };
  }
  if (daysLeft <= 90) {
    return { label: "Expiring soon", className: `${TAG} border-line-strong bg-[#F3F5F4] text-ink-soft` };
  }
  return null;
}

function getStockStatus(quantity: number) {
  if (quantity <= 0) {
    return { label: "Out of stock", className: `${TAG} border-danger/25 bg-danger-soft text-danger` };
  }
  if (quantity <= 10) {
    return { label: "Low stock", className: `${TAG} border-warn/25 bg-warn-soft text-warn` };
  }
  return null;
}

const formatExpiry = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function InventoryPage() {
  const user = useAppSelector((state) => state.auth.user);
  const medicalId = user?.medicalId;

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | MedicineCategory>("All");

  const loadMedicines = useCallback(async () => {
    if (!medicalId) return;
    try {
      const data = await getMedicines(medicalId);
      setMedicines(data);
    } catch (error) {
      console.error("Error loading medicines:", error);
    } finally {
      setLoaded(true);
    }
  }, [medicalId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state updates run after the fetch resolves
    loadMedicines();
  }, [loadMedicines]);

  const handleAddMedicine = async (medicineData: CreateMedicinePayload) => {
    if (!medicalId) return;
    try {
      await createMedicine(medicalId, medicineData);
      await loadMedicines();
      setDialogOpen(false);
    } catch (error) {
      console.error("Error adding medicine:", error);
    }
  };

  const openDetails = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setDetailsOpen(true);
  };

  const filteredMedicines = useMemo(() => {
    return medicines.filter((medicine) => {
      const matchesSearch =
        medicine.medicineName.toLowerCase().includes(search.toLowerCase()) ||
        medicine.genericName.toLowerCase().includes(search.toLowerCase()) ||
        medicine.manufacturer.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" ? true : medicine.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [medicines, search, selectedCategory]);

  const categories: ("All" | MedicineCategory)[] = ["All", ...MEDICINE_CATEGORIES];

  const totalValue = medicines.reduce((sum, m) => sum + m.sellingPrice * m.quantity, 0);
  const lowStockCount = medicines.filter((m) => m.quantity <= 10).length;

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Medicine stock, batches and expiry at a glance"
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
          >
            Add medicine
          </Button>
        }
      />

      <StatsStrip cols={3}>
        <StatsCard
          title="Items in catalogue"
          value={medicines.length}
          hint={`${filteredMedicines.length} shown with current filters`}
        />
        <StatsCard
          title="Stock value"
          value={`₹${totalValue.toLocaleString("en-IN")}`}
          hint="At selling price"
        />
        <StatsCard
          title="Low stock"
          value={lowStockCount}
          tone={lowStockCount > 0 ? "warn" : "ok"}
          hint={lowStockCount > 0 ? "At or below 10 units" : "All items sufficiently stocked"}
        />
      </StatsStrip>

      {/* Toolbar: search + category filter */}
      <div className="mt-5 rounded-card border border-line bg-white p-3 md:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <TextField
            fullWidth
            placeholder="Search by medicine, generic name or manufacturer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18, color: "#8A968F" }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <div
            className="flex shrink-0 flex-wrap items-center gap-1 rounded-ctl border border-line bg-canvas p-1"
            role="group"
            aria-label="Filter by category"
          >
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={isActive}
                  className={`rounded-chip border px-2.5 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-line bg-white text-ink shadow-[0_1px_2px_rgba(16,32,28,0.06)]"
                      : "border-transparent text-ink-soft hover:text-ink"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-5 overflow-hidden rounded-card border border-line bg-white">
        {!loaded ? (
          <div className="space-y-px">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={52} sx={{ bgcolor: "#EDF1EF" }} />
            ))}
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-ctl bg-canvas">
              <Medication sx={{ fontSize: 22, color: "#8A968F" }} />
            </span>
            <h3 className="mt-3 text-[15px] font-semibold text-ink">
              {search || selectedCategory !== "All"
                ? "No medicines match the filter"
                : "No medicines yet"}
            </h3>
            <p className="mt-1 max-w-sm text-[13px] text-ink-soft">
              {search || selectedCategory !== "All"
                ? "Adjust the search term or category to see more items."
                : "Add your first medicine to start tracking stock, batches and expiry."}
            </p>
            {!search && selectedCategory === "All" && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setDialogOpen(true)}
                sx={{ mt: 3 }}
              >
                Add medicine
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-mute md:px-5">
                    Medicine
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-mute">
                    Category
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-mute">
                    Batch
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-mute">
                    Expiry
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-mute">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-mute">
                    Selling
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-mute">
                    Profit/unit
                  </th>
                  <th className="w-10 px-2 py-3" />
                </tr>
              </thead>

              <tbody>
                {filteredMedicines.map((medicine) => {
                  const expiryStatus = getExpiryStatus(medicine.expiryDate);
                  const stockStatus = getStockStatus(medicine.quantity);
                  const profit = medicine.sellingPrice - medicine.purchasePrice;

                  const open = () => openDetails(medicine);
                  const onKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      open();
                    }
                  };

                  return (
                    <tr
                      key={medicine.id}
                      tabIndex={0}
                      onClick={open}
                      onKeyDown={onKeyDown}
                      className="cursor-pointer transition-colors hover:bg-canvas focus:outline-none focus-visible:bg-canvas"
                    >
                      <td className="px-4 py-3 md:px-5">
                        <p className="text-[13px] font-semibold text-ink">
                          {medicine.medicineName}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-soft">
                          {medicine.genericName}
                          {medicine.manufacturer ? ` · ${medicine.manufacturer}` : ""}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-chip border border-line bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-ink-soft">
                          {medicine.category}
                        </span>
                      </td>

                      <td className="tnum px-4 py-3 text-[13px] text-ink-soft">
                        {medicine.batchNumber}
                      </td>

                      <td className="px-4 py-3">
                        <p className="tnum text-[13px] text-ink">{formatExpiry(medicine.expiryDate)}</p>
                        {expiryStatus && (
                          <span className={`${expiryStatus.className} mt-1`}>
                            {expiryStatus.label}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <span className="tnum text-[13px] font-semibold text-ink">
                          {medicine.quantity}
                        </span>
                        {stockStatus && (
                          <span className={`${stockStatus.className} ml-2`}>
                            {stockStatus.label}
                          </span>
                        )}
                      </td>

                      <td className="tnum px-4 py-3 text-right text-[13px] font-semibold text-ink">
                        ₹{medicine.sellingPrice.toLocaleString("en-IN")}
                      </td>

                      <td
                        className={`tnum px-4 py-3 text-right text-[13px] font-semibold ${
                          profit >= 0 ? "text-ok" : "text-danger"
                        }`}
                      >
                        ₹{profit.toLocaleString("en-IN")}
                      </td>

                      <td className="px-2 py-3">
                        <ChevronRight sx={{ fontSize: 18, color: "#B3BDB8" }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MedicineFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleAddMedicine}
      />
      <MedicineDetailsDialog
        key={selectedMedicine?.id ?? "none"}
        open={detailsOpen}
        medicine={selectedMedicine}
        onClose={() => setDetailsOpen(false)}
        onUpdated={loadMedicines}
      />
    </div>
  );
}
