import { useEffect, useMemo, useState } from "react";
import {
  Button,
  TextField,
  InputAdornment,
  Chip,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Search,
  Add,
  Remove,
  Delete,
  ShoppingCart,
  Receipt,
  PointOfSale,
  Close,
  Person,
  Payment,
  CheckCircle,
} from "@mui/icons-material";

import { getMedicines } from "../../features/inventory/inventoryService";
import { createSale, deductStock } from "../../features/pos/posService";
import { useAppSelector } from "../../hooks/reduxHooks";

import type { Medicine, MedicineCategory } from "../../features/inventory/inventoryTypes";
import type { CartItem, SaleItem } from "../../features/pos/posTypes";

// ─── Helpers ───────────────────────────────────────────────────────────────

const categoryColors: Record<string, { bg: string; text: string }> = {
  Tablet: { bg: "bg-blue-50", text: "text-blue-700" },
  Capsule: { bg: "bg-purple-50", text: "text-purple-700" },
  Syrup: { bg: "bg-emerald-50", text: "text-emerald-700" },
  Injection: { bg: "bg-rose-50", text: "text-rose-700" },
  Other: { bg: "bg-slate-50", text: "text-slate-700" },
};

const TAX_RATE = 0.05; // 5% GST

// ─── Component ─────────────────────────────────────────────────────────────

export default function POSPage() {
  const user = useAppSelector((state) => state.auth.user);
  const medicalId = user?.medicalId;

  // Data
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & filter
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | MedicineCategory>("All");

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Checkout
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi">("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Receipt
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<{
    items: CartItem[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paymentMethod: string;
  } | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  // ─── Load medicines ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!medicalId) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getMedicines(medicalId);
        setMedicines(data.filter((m) => m.quantity > 0));
      } catch {
        setSnackbar({ open: true, message: "Failed to load inventory", severity: "error" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [medicalId]);

  // ─── Filtered products ───────────────────────────────────────────────────

  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        m.medicineName.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.manufacturer.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === "All" || m.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [medicines, search, selectedCategory]);

  // ─── Cart calculations ───────────────────────────────────────────────────

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  }, [cart]);

  const cartTax = useMemo(() => {
    return Math.round((cartSubtotal - discount) * TAX_RATE * 100) / 100;
  }, [cartSubtotal, discount]);

  const cartTotal = useMemo(() => {
    return Math.max(0, Math.round((cartSubtotal - discount + cartTax) * 100) / 100);
  }, [cartSubtotal, discount, cartTax]);

  // ─── Cart actions ────────────────────────────────────────────────────────

  const addToCart = (medicine: Medicine) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.medicineId === medicine.id);
      if (existing) {
        if (existing.quantity >= medicine.quantity) {
          setSnackbar({ open: true, message: "Not enough stock available", severity: "error" });
          return prev;
        }
        return prev.map((item) =>
          item.medicineId === medicine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          medicineId: medicine.id,
          medicineName: medicine.medicineName,
          genericName: medicine.genericName,
          batchNumber: medicine.batchNumber,
          sellingPrice: medicine.sellingPrice,
          quantity: 1,
          maxQuantity: medicine.quantity,
        },
      ];
    });
  };

  const updateQuantity = (medicineId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.medicineId !== medicineId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.maxQuantity) {
            setSnackbar({ open: true, message: "Not enough stock", severity: "error" });
            return item;
          }
          return { ...item, quantity: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (medicineId: string) => {
    setCart((prev) => prev.filter((item) => item.medicineId !== medicineId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCustomerName("");
    setCustomerPhone("");
  };

  // ─── Checkout ────────────────────────────────────────────────────────────

  const handleCheckout = async () => {
    if (!medicalId || cart.length === 0) return;
    setSubmitting(true);
    try {
      const saleItems: SaleItem[] = cart.map((item) => {
        // Find the original medicine to get the purchase price
        const medicine = medicines.find((m) => m.id === item.medicineId);
        return {
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          genericName: item.genericName,
          batchNumber: item.batchNumber,
          sellingPrice: item.sellingPrice,
          purchasePrice: medicine?.purchasePrice ?? 0,
          quantity: item.quantity,
          subtotal: item.sellingPrice * item.quantity,
        };
      });

      await deductStock(saleItems);

      await createSale({
        medicalId,
        items: saleItems,
        subtotal: cartSubtotal,
        discount,
        tax: cartTax,
        total: cartTotal,
        paymentMethod: paymentMethod as "cash" | "card" | "upi" | "other",
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
      });

      setLastSale({
        items: [...cart],
        subtotal: cartSubtotal,
        discount,
        tax: cartTax,
        total: cartTotal,
        paymentMethod,
      });

      setCheckoutOpen(false);
      setReceiptOpen(true);
      clearCart();

      // Reload inventory to reflect reduced stock
      const data = await getMedicines(medicalId);
      setMedicines(data.filter((m) => m.quantity > 0));

      setSnackbar({ open: true, message: "Sale completed successfully!", severity: "success" });
    } catch (err: any) {
      console.error("Checkout error:", err);
      setSnackbar({ open: true, message: err?.message || "Failed to process sale", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Categories ──────────────────────────────────────────────────────────

  const categories: ("All" | MedicineCategory)[] = [
    "All", "Tablet", "Capsule", "Syrup", "Injection", "Other",
  ];

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100dvh-110px)] flex-col gap-4 lg:flex-row md:h-[calc(100vh-110px)]">
      {/* ── LEFT: Products Panel ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-slate-100 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <TextField
              fullWidth
              placeholder="Search medicines by name, generic, or brand..."
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
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <Chip
                  key={cat}
                  label={cat}
                  clickable
                  onClick={() => setSelectedCategory(cat)}
                  sx={{
                    borderRadius: "8px",
                    fontWeight: active ? 600 : 500,
                    backgroundColor: active ? "#2563EB" : "#F1F5F9",
                    color: active ? "white" : "#64748B",
                    border: "1px solid",
                    borderColor: active ? "#2563EB" : "#E2E8F0",
                    transition: "all 0.2s",
                    "&:hover": { backgroundColor: active ? "#1D4ED8" : "#E2E8F0" },
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: "12px" }} />
              ))}
            </div>
          ) : filteredMedicines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                <Search sx={{ fontSize: 28, color: "#CBD5E1" }} />
              </div>
              <p className="mt-3 font-medium text-slate-900">No products found</p>
              <p className="mt-1 text-sm text-slate-500">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredMedicines.map((medicine) => {
                const catStyle = categoryColors[medicine.category] || categoryColors.Other;
                const inCart = cart.find((c) => c.medicineId === medicine.id);
                const stockLow = medicine.quantity <= 10;

                return (
                  <button
                    key={medicine.id}
                    onClick={() => addToCart(medicine)}
                    className={`group relative flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                      inCart
                        ? "border-blue-200 bg-blue-50/50"
                        : "border-slate-100 bg-white hover:border-blue-100"
                    }`}
                  >
                    {/* Stock badge */}
                    {stockLow && (
                      <span className="absolute right-2 top-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        {medicine.quantity} left
                      </span>
                    )}

                    {/* Category dot */}
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${catStyle.bg}`}>
                      <span className={`text-xs font-bold ${catStyle.text}`}>
                        {medicine.category.slice(0, 2).toUpperCase()}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {medicine.medicineName}
                      </p>
                      <p className="truncate text-xs text-slate-500">{medicine.genericName}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm font-bold text-emerald-600">
                          ₹{medicine.sellingPrice}
                        </span>
                        {inCart && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                            {inCart.quantity} in cart
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Cart Panel ────────────────────────────────────────────── */}
      <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:w-[380px]">
        {/* Cart Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <ShoppingCart sx={{ fontSize: 18, color: "#2563EB" }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Cart</h3>
              <p className="text-xs text-slate-500">{cart.length} item{cart.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          {cart.length > 0 && (
            <Button
              size="small"
              onClick={clearCart}
              sx={{
                minWidth: 0,
                borderRadius: "8px",
                textTransform: "none",
                color: "#94A3B8",
                fontSize: 12,
                "&:hover": { backgroundColor: "#F1F5F9" },
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                <ShoppingCart sx={{ fontSize: 28, color: "#CBD5E1" }} />
              </div>
              <p className="mt-3 font-medium text-slate-900">Cart is empty</p>
              <p className="mt-1 text-xs text-slate-500">Click on medicines to add them</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.medicineId}
                  className="group rounded-xl border border-slate-100 bg-white p-3 transition-all hover:border-slate-200 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{item.medicineName}</p>
                      <p className="text-xs text-slate-500 truncate">{item.genericName}</p>
                    </div>
                    <IconButton
                      size="small"
                      onClick={() => removeFromCart(item.medicineId)}
                      sx={{
                        ml: 1,
                        color: "#CBD5E1",
                        "&:hover": { color: "#EF4444", backgroundColor: "#FEF2F2" },
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <IconButton
                        size="small"
                        onClick={() => updateQuantity(item.medicineId, -1)}
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: "8px",
                          backgroundColor: "#F1F5F9",
                          "&:hover": { backgroundColor: "#E2E8F0" },
                        }}
                      >
                        <Remove sx={{ fontSize: 14 }} />
                      </IconButton>
                      <span className="flex h-7 min-w-[32px] items-center justify-center rounded-lg bg-blue-50 px-2 text-xs font-bold text-blue-700">
                        {item.quantity}
                      </span>
                      <IconButton
                        size="small"
                        onClick={() => updateQuantity(item.medicineId, 1)}
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: "8px",
                          backgroundColor: "#F1F5F9",
                          "&:hover": { backgroundColor: "#E2E8F0" },
                        }}
                      >
                        <Add sx={{ fontSize: 14 }} />
                      </IconButton>
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      ₹{(item.sellingPrice * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Checkout */}
        {cart.length > 0 && (
          <div className="border-t border-slate-100 p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900">₹{cartSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Discount</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                    className="w-16 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-right text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none"
                    min={0}
                    max={cartSubtotal}
                  />
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
                <span className="font-medium text-slate-900">₹{cartTax.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-100 pt-2">
                <div className="flex justify-between">
                  <span className="text-base font-bold text-slate-900">Total</span>
                  <span className="text-lg font-bold text-blue-700">₹{cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<PointOfSale />}
              onClick={() => setCheckoutOpen(true)}
              sx={{
                mt: 3,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 700,
                py: 1.5,
                fontSize: 16,
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
                background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                "&:hover": {
                  boxShadow: "0 6px 20px rgba(37, 99, 235, 0.4)",
                },
              }}
            >
              Checkout · ₹{cartTotal.toFixed(2)}
            </Button>
          </div>
        )}
      </div>

      {/* ── CHECKOUT DIALOG ───────────────────────────────────────────────── */}
      <Dialog
        open={checkoutOpen}
        onClose={() => !submitting && setCheckoutOpen(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: "20px", overflow: "hidden" } } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1,
            pt: 2.5,
            px: 3,
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Complete Sale</h2>
            <p className="mt-0.5 text-sm text-slate-500">Review order and confirm payment</p>
          </div>
          <IconButton
            onClick={() => setCheckoutOpen(false)}
            size="small"
            sx={{ color: "#94A3B8", "&:hover": { backgroundColor: "#F1F5F9" } }}
          >
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 3 }}>
          <div className="space-y-4">
            {/* Customer info */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Person sx={{ fontSize: 16, color: "#64748B" }} />
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Customer</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <TextField
                  size="small"
                  placeholder="Customer name (optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      backgroundColor: "white",
                      fontSize: 14,
                    },
                  }}
                />
                <TextField
                  size="small"
                  placeholder="Phone (optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      backgroundColor: "white",
                      fontSize: 14,
                    },
                  }}
                />
              </div>
            </div>

            {/* Order summary */}
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Order Summary</p>
              <div className="space-y-2">
                {cart.slice(0, 5).map((item) => (
                  <div key={item.medicineId} className="flex justify-between text-sm">
                    <span className="text-slate-600 truncate max-w-[220px]">
                      {item.medicineName} × {item.quantity}
                    </span>
                    <span className="font-medium text-slate-900">
                      ₹{(item.sellingPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
                {cart.length > 5 && (
                  <p className="text-xs text-slate-400">+{cart.length - 5} more items</p>
                )}
              </div>
            </div>

            {/* Payment method */}
            <FormControl>
              <FormLabel sx={{ fontSize: 12, fontWeight: 600, color: "#64748B", mb: 1 }}>
                Payment Method
              </FormLabel>
              <RadioGroup
                row
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as "cash" | "card" | "upi")}
              >
                {[
                  { value: "cash", label: "Cash", icon: "💵" },
                  { value: "card", label: "Card", icon: "💳" },
                  { value: "upi", label: "UPI", icon: "📱" },
                ].map((opt) => (
                  <FormControlLabel
                    key={opt.value}
                    value={opt.value}
                    control={
                      <Radio
                        sx={{
                          color: "#CBD5E1",
                          "&.Mui-checked": { color: "#2563EB" },
                        }}
                      />
                    }
                    label={
                      <span className="text-sm">
                        {opt.icon} {opt.label}
                      </span>
                    }
                    sx={{
                      mr: 0,
                      flex: 1,
                      borderRadius: "10px",
                      border: "1px solid",
                      borderColor: paymentMethod === opt.value ? "#2563EB" : "#E2E8F0",
                      backgroundColor: paymentMethod === opt.value ? "#EFF6FF" : "transparent",
                      mx: 0.5,
                      px: 1,
                      py: 0.5,
                      transition: "all 0.2s",
                    }}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            {/* Totals */}
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-50/30 p-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-900">₹{cartSubtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Discount</span>
                    <span className="text-emerald-600">-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
                  <span className="text-slate-900">₹{cartTax.toFixed(2)}</span>
                </div>
                <div className="border-t border-blue-100 pt-1.5">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="text-lg font-bold text-blue-700">₹{cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5, borderTop: "1px solid #F1F5F9" }}>
          <Button
            onClick={() => setCheckoutOpen(false)}
            disabled={submitting}
            sx={{ borderRadius: "10px", textTransform: "none", color: "#64748B", fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCheckout}
            disabled={submitting}
            startIcon={submitting ? undefined : <Payment />}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              px: 4,
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
              background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
              "&:hover": { boxShadow: "0 6px 20px rgba(37, 99, 235, 0.4)" },
            }}
          >
            {submitting ? "Processing..." : `Pay ₹${cartTotal.toFixed(2)}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── RECEIPT DIALOG ────────────────────────────────────────────────── */}
      <Dialog
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: "20px" } } }}
      >
        <DialogContent sx={{ textAlign: "center", py: 4, px: 4 }}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle sx={{ fontSize: 32, color: "#059669" }} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Payment Successful!</h2>
          <p className="mt-1 text-sm text-slate-500">Sale completed successfully</p>

          {lastSale && (
            <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 text-left">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <Receipt sx={{ fontSize: 18, color: "#64748B" }} />
                <span className="text-sm font-semibold text-slate-900">Receipt</span>
              </div>
              <div className="mt-3 space-y-2">
                {lastSale.items.map((item) => (
                  <div key={item.medicineId} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.medicineName} × {item.quantity}</span>
                    <span className="font-medium text-slate-900">
                      ₹{(item.sellingPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-slate-200 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total</span>
                  <span className="font-bold text-slate-900">₹{lastSale.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-slate-400">Payment</span>
                  <span className="font-medium text-slate-600 uppercase">{lastSale.paymentMethod}</span>
                </div>
              </div>
            </div>
          )}

          <Button
            fullWidth
            variant="contained"
            onClick={() => setReceiptOpen(false)}
            sx={{
              mt: 4,
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
              py: 1.5,
              background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
            }}
          >
            New Sale
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── SNACKBAR ──────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: "12px", boxShadow: "0 4px 14px rgba(0,0,0,0.1)" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
