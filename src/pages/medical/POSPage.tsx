import { useEffect, useMemo, useState } from "react";
import {
  Button,
  TextField,
  InputAdornment,
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
  Payments,
  CreditCard,
  Smartphone,
  CheckCircle,
} from "@mui/icons-material";

import { getMedicines } from "../../features/inventory/inventoryService";
import { createSale, deductStock } from "../../features/pos/posService";
import { useAppSelector } from "../../hooks/reduxHooks";

import {
  CATEGORY_META,
  MEDICINE_CATEGORIES,
} from "../../features/inventory/categoryMeta";

import type { Medicine, MedicineCategory } from "../../features/inventory/inventoryTypes";
import type { CartItem, SaleItem } from "../../features/pos/posTypes";

const TAX_RATE = 0.05; // 5% GST

const PAYMENT_OPTIONS = [
  { value: "cash", label: "Cash", icon: <Payments sx={{ fontSize: 18 }} /> },
  { value: "card", label: "Card", icon: <CreditCard sx={{ fontSize: 18 }} /> },
  { value: "upi", label: "UPI", icon: <Smartphone sx={{ fontSize: 18 }} /> },
] as const;

const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

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
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  // ─── Load medicines ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!medicalId) return;
    const load = async () => {
      try {
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

      setSnackbar({ open: true, message: "Sale completed", severity: "success" });
    } catch (err) {
      console.error("Checkout error:", err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : "Failed to process sale",
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Categories ──────────────────────────────────────────────────────────

  const categories: ("All" | MedicineCategory)[] = ["All", ...MEDICINE_CATEGORIES];

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100dvh-172px)] min-h-[460px] flex-col gap-4 md:h-[calc(100dvh-100px)] lg:flex-row">
      {/* ── Products ─────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-card border border-line bg-white">
        <div className="shrink-0 border-b border-line p-3 md:p-4">
          <TextField
            fullWidth
            placeholder="Search medicines by name, generic or manufacturer…"
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
            className="mt-3 flex flex-wrap items-center gap-1 rounded-ctl border border-line bg-canvas p-1"
            role="group"
            aria-label="Filter by category"
          >
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  aria-pressed={active}
                  className={`rounded-chip border px-2.5 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "border-line bg-white text-ink shadow-[0_1px_2px_rgba(16,32,28,0.06)]"
                      : "border-transparent text-ink-soft hover:text-ink"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 md:p-4">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={84} sx={{ borderRadius: "6px", bgcolor: "#EDF1EF" }} />
              ))}
            </div>
          ) : filteredMedicines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-ctl bg-canvas">
                <Search sx={{ fontSize: 20, color: "#8A968F" }} />
              </span>
              <p className="mt-3 text-[14px] font-semibold text-ink">No products found</p>
              <p className="mt-1 text-xs text-ink-soft">Try a different search term or category.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredMedicines.map((medicine) => {
                const meta = CATEGORY_META[medicine.category];
                const inCart = cart.find((c) => c.medicineId === medicine.id);
                const stockLow = medicine.quantity <= 10;

                return (
                  <button
                    key={medicine.id}
                    onClick={() => addToCart(medicine)}
                    className={`flex items-center gap-3 rounded-ctl border p-3 text-left transition-colors ${
                      inCart
                        ? "border-primary bg-primary-soft"
                        : "border-line bg-white hover:border-line-strong hover:bg-canvas"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-chip ${meta.tileBg} ${meta.tileText}`}
                    >
                      <span className="text-[11px] font-bold">{meta.initials}</span>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
                          {medicine.medicineName}
                        </span>
                        {stockLow && (
                          <span className="tnum shrink-0 text-[11px] font-medium text-warn">
                            {medicine.quantity} left
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-ink-soft">
                        {medicine.genericName}
                      </span>
                      <span className="mt-1 flex items-center justify-between">
                        <span className="tnum text-[13px] font-semibold text-ink">
                          {inr(medicine.sellingPrice)}
                        </span>
                        {inCart && (
                          <span className="tnum rounded-chip bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {inCart.quantity} in cart
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Cart ─────────────────────────────────────────────────────────── */}
      <div className="flex h-[46%] min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-card border border-line bg-white lg:h-auto lg:w-[368px]">
        <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingCart sx={{ fontSize: 18, color: "#4E5D57" }} />
            <div>
              <h2 className="text-[14px] font-semibold leading-tight text-ink">Current sale</h2>
              <p className="tnum text-xs text-ink-soft">
                {cart.length} item{cart.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {cart.length > 0 && (
            <Button size="small" onClick={clearCart} sx={{ color: "#8A968F" }}>
              Clear
            </Button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-ctl bg-canvas">
                <ShoppingCart sx={{ fontSize: 20, color: "#8A968F" }} />
              </span>
              <p className="mt-3 text-[14px] font-semibold text-ink">Cart is empty</p>
              <p className="mt-1 text-xs text-ink-soft">
                Select a medicine to start a sale.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {cart.map((item) => (
                <li key={item.medicineId} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">
                        {item.medicineName}
                      </p>
                      <p className="tnum truncate text-xs text-ink-soft">
                        Batch {item.batchNumber} · {inr(item.sellingPrice)} each
                      </p>
                    </div>
                    <IconButton
                      size="small"
                      onClick={() => removeFromCart(item.medicineId)}
                      aria-label={`Remove ${item.medicineName}`}
                      sx={{ color: "#B3BDB8", "&:hover": { color: "#B42318", backgroundColor: "#FAEBE9" } }}
                    >
                      <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <IconButton
                        size="small"
                        onClick={() => updateQuantity(item.medicineId, -1)}
                        aria-label="Decrease quantity"
                        sx={{
                          width: 26,
                          height: 26,
                          border: "1px solid #D4DAD7",
                          color: "#4E5D57",
                          "&:hover": { backgroundColor: "#F5F7F6" },
                        }}
                      >
                        <Remove sx={{ fontSize: 14 }} />
                      </IconButton>
                      <span className="tnum flex h-6 min-w-[30px] items-center justify-center px-1 text-[13px] font-semibold text-ink">
                        {item.quantity}
                      </span>
                      <IconButton
                        size="small"
                        onClick={() => updateQuantity(item.medicineId, 1)}
                        aria-label="Increase quantity"
                        sx={{
                          width: 26,
                          height: 26,
                          border: "1px solid #D4DAD7",
                          color: "#4E5D57",
                          "&:hover": { backgroundColor: "#F5F7F6" },
                        }}
                      >
                        <Add sx={{ fontSize: 14 }} />
                      </IconButton>
                    </div>
                    <p className="tnum text-[14px] font-semibold text-ink">
                      {inr(item.sellingPrice * item.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.length > 0 && (
          <div className="shrink-0 border-t border-line p-4">
            <dl className="space-y-1.5 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd className="tnum font-medium text-ink">{inr(cartSubtotal)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">Discount</dt>
                <dd>
                  <input
                    type="number"
                    aria-label="Discount amount in rupees"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                    className="tnum w-20 rounded-chip border border-line-strong bg-white px-2 py-1 text-right text-[13px] font-medium text-ink focus:border-primary focus:outline-none"
                    min={0}
                    max={cartSubtotal}
                  />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">GST ({(TAX_RATE * 100).toFixed(0)}%)</dt>
                <dd className="tnum font-medium text-ink">₹{cartTax.toFixed(2)}</dd>
              </div>
            </dl>

            <div className="mt-2.5 flex items-baseline justify-between border-t border-line pt-2.5">
              <span className="text-[13px] font-semibold text-ink">Total</span>
              <span className="tnum text-[19px] font-semibold tracking-tight text-ink">
                ₹{cartTotal.toFixed(2)}
              </span>
            </div>

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<PointOfSale />}
              onClick={() => setCheckoutOpen(true)}
              sx={{ mt: 3 }}
            >
              Checkout · ₹{cartTotal.toFixed(2)}
            </Button>
          </div>
        )}
      </div>

      {/* ── Checkout dialog ──────────────────────────────────────────────── */}
      <Dialog
        open={checkoutOpen}
        onClose={() => !submitting && setCheckoutOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
            pb: 1.5,
            pt: 2.5,
            px: 3,
            borderBottom: "1px solid #E5E9E7",
          }}
        >
          <div>
            <h2 className="text-[16px] font-semibold text-ink">Complete sale</h2>
            <p className="mt-0.5 text-[13px] text-ink-soft">
              {cart.length} item{cart.length !== 1 ? "s" : ""} · ₹{cartTotal.toFixed(2)} due
            </p>
          </div>
          <IconButton
            onClick={() => setCheckoutOpen(false)}
            size="small"
            aria-label="Close"
            disabled={submitting}
            sx={{ color: "#8A968F" }}
          >
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 3 }}>
          <div className="space-y-4">
            {/* Customer */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-mute">
                <Person sx={{ fontSize: 14 }} />
                Customer (optional)
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  fullWidth
                />
              </div>
            </div>

            {/* Items */}
            <div className="rounded-ctl border border-line">
              <p className="border-b border-line px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-mute">
                Items
              </p>
              <div className="divide-y divide-line px-3">
                {cart.slice(0, 5).map((item) => (
                  <div key={item.medicineId} className="flex justify-between py-2 text-[13px]">
                    <span className="truncate pr-3 text-ink-soft">
                      {item.medicineName} × {item.quantity}
                    </span>
                    <span className="tnum font-medium text-ink">
                      {inr(item.sellingPrice * item.quantity)}
                    </span>
                  </div>
                ))}
                {cart.length > 5 && (
                  <p className="py-2 text-xs text-ink-mute">
                    +{cart.length - 5} more item{cart.length - 5 !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>

            {/* Payment method */}
            <FormControl>
              <FormLabel
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#8A968F",
                  mb: 1,
                }}
              >
                Payment method
              </FormLabel>
              <RadioGroup
                row
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as "cash" | "card" | "upi")
                }
                sx={{ gap: 1 }}
              >
                {PAYMENT_OPTIONS.map((opt) => (
                  <FormControlLabel
                    key={opt.value}
                    value={opt.value}
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: "#B3BDB8",
                          p: 0.5,
                          "&.Mui-checked": { color: "#0F766E" },
                        }}
                      />
                    }
                    label={
                      <span className="flex items-center gap-1.5 text-[13px] font-medium">
                        {opt.icon}
                        {opt.label}
                      </span>
                    }
                    sx={{
                      m: 0,
                      flex: 1,
                      minWidth: 90,
                      border: "1px solid",
                      borderColor: paymentMethod === opt.value ? "#0F766E" : "#E5E9E7",
                      borderRadius: "6px",
                      px: 1.25,
                      py: 0.5,
                      backgroundColor: paymentMethod === opt.value ? "#E7F3F1" : "#FFFFFF",
                      transition: "border-color 0.15s, background-color 0.15s",
                      "&:hover": {
                        backgroundColor:
                          paymentMethod === opt.value ? "#E7F3F1" : "#F5F7F6",
                      },
                    }}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            {/* Totals */}
            <dl className="space-y-1.5 rounded-ctl bg-canvas p-3 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd className="tnum font-medium text-ink">{inr(cartSubtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Discount</dt>
                  <dd className="tnum font-medium text-ok">-₹{discount}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-soft">GST ({(TAX_RATE * 100).toFixed(0)}%)</dt>
                <dd className="tnum font-medium text-ink">₹{cartTax.toFixed(2)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-1.5">
                <dt className="text-[13px] font-semibold text-ink">Total due</dt>
                <dd className="tnum text-[17px] font-semibold text-ink">
                  ₹{cartTotal.toFixed(2)}
                </dd>
              </div>
            </dl>
          </div>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5, borderTop: "1px solid #E5E9E7" }}>
          <Button onClick={() => setCheckoutOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={handleCheckout}
            disabled={submitting || cart.length === 0}
            startIcon={submitting ? undefined : <Payments />}
          >
            {submitting ? "Processing…" : `Pay ₹${cartTotal.toFixed(2)}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Receipt dialog ───────────────────────────────────────────────── */}
      <Dialog
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogContent sx={{ px: 3, py: 4 }}>
          <div className="flex flex-col items-center text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ok-soft">
              <CheckCircle sx={{ fontSize: 22, color: "#157F3D" }} />
            </span>
            <h2 className="mt-3 text-[17px] font-semibold text-ink">Sale recorded</h2>
            <p className="mt-0.5 text-[13px] text-ink-soft">Stock has been updated.</p>
          </div>

          {lastSale && (
            <div className="mt-4 rounded-ctl border border-dashed border-line-strong bg-canvas p-3.5 text-left">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
                  <Receipt sx={{ fontSize: 15, color: "#4E5D57" }} />
                  Receipt
                </span>
                <span className="rounded-chip border border-line bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ink-soft">
                  {lastSale.paymentMethod}
                </span>
              </div>

              <div className="mt-2.5 space-y-1.5">
                {lastSale.items.map((item) => (
                  <div key={item.medicineId} className="flex justify-between text-[13px]">
                    <span className="truncate pr-3 text-ink-soft">
                      {item.medicineName} × {item.quantity}
                    </span>
                    <span className="tnum font-medium text-ink">
                      {inr(item.sellingPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-2.5 flex items-baseline justify-between border-t border-line-strong pt-2">
                <span className="text-[13px] font-semibold text-ink">Total paid</span>
                <span className="tnum text-[16px] font-semibold text-ink">
                  ₹{lastSale.total.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => setReceiptOpen(false)}
            sx={{ mt: 4 }}
          >
            Start next sale
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── Snackbar ─────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
