import { useEffect, useMemo, useState } from "react";

import {
  Button,
  Chip,
  TextField,
  Skeleton,
  MenuItem,
  Select,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  PictureAsPdf,
  TableChart,
  CalendarMonth,
  TrendingUp,
  ShoppingCart,
  Inventory2,
  Receipt,
  ArrowUpward,
  LocalAtm,
  CreditCard,
  PhoneIphone,
  Category,
} from "@mui/icons-material";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartTooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import PageHeader from "../../components/ui/PageHeader";
import { useAppSelector } from "../../hooks/reduxHooks";
import {
  getSalesSummary,
  getDailyRevenue,
  getTopMedicines,
  getCategorySales,
  getPaymentMethodBreakdown,
  getSalesInRange,
  salesToCsvRows,
  topMedicinesToCsvRows,
} from "../../features/reports/reportService";

import type {
  SalesSummary,
  DailyRevenuePoint,
  TopMedicine,
  CategorySales,
  PaymentMethodBreakdown,
} from "../../features/reports/reportTypes";

// ─── Date Presets ──────────────────────────────────────────────────────────

type DatePreset = "today" | "thisWeek" | "thisMonth" | "lastMonth" | "custom";

const getDateRange = (preset: DatePreset): { start: Date; end: Date } => {
  const start = new Date();
  const end = new Date();

  switch (preset) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "thisWeek": {
      const day = start.getDay();
      const diff = day === 0 ? 6 : day - 1; // Monday
      start.setDate(start.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "thisMonth":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "lastMonth":
      start.setMonth(start.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "custom":
      break;
  }

  return { start, end };
};

const formatDate = (d: Date) => d.toISOString().split("T")[0];

// ─── Chart Colors ──────────────────────────────────────────────────────────

const PIE_COLORS = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626", "#0891B2"];

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  cash: <LocalAtm sx={{ fontSize: 18 }} />,
  card: <CreditCard sx={{ fontSize: 18 }} />,
  upi: <PhoneIphone sx={{ fontSize: 18 }} />,
  other: <Receipt sx={{ fontSize: 18 }} />,
};

// ─── Custom Recharts Tooltip ───────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-lg">
        <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
            {entry.name}: ₹{entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Component ─────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const medicalId = user?.medicalId;

  // Date filter
  const [datePreset, setDatePreset] = useState<DatePreset>("thisMonth");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Data
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenuePoint[]>([]);
  const [topMedicines, setTopMedicines] = useState<TopMedicine[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentMethodBreakdown[]>([]);
  const [topMedForExport, setTopMedForExport] = useState<TopMedicine[]>([]);

  // Table sort
  const [sortField, setSortField] = useState<keyof TopMedicine>("totalRevenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // ─── Load Data ──────────────────────────────────────────────────────────

  const loadData = async () => {
    if (!medicalId) return;
    setLoading(true);

    try {
      const range = datePreset === "custom"
        ? { start: new Date(customStart), end: new Date(customEnd) }
        : getDateRange(datePreset);

      const [sum, daily, top, cat, pay] = await Promise.all([
        getSalesSummary(medicalId, range.start, range.end),
        getDailyRevenue(medicalId, range.start, range.end),
        getTopMedicines(medicalId, range.start, range.end),
        getCategorySales(medicalId, range.start, range.end),
        getPaymentMethodBreakdown(medicalId, range.start, range.end),
      ]);

      setSummary(sum);
      setDailyRevenue(daily);
      setTopMedicines(top);
      setCategorySales(cat);
      setPaymentBreakdown(pay);
      setTopMedForExport(top);
    } catch (err) {
      console.error("Report load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [medicalId, datePreset]);

  // ─── Handle custom date change ───────────────────────────────────────────

  const handleCustomDateChange = () => {
    if (customStart && customEnd && new Date(customStart) <= new Date(customEnd)) {
      loadData();
    }
  };

  // ─── Sorted top medicines ────────────────────────────────────────────────

  const sortedMedicines = useMemo(() => {
    return [...topMedicines].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      return sortDir === "desc"
        ? (valB as number) - (valA as number)
        : (valA as number) - (valB as number);
    });
  }, [topMedicines, sortField, sortDir]);

  const toggleSort = (field: keyof TopMedicine) => {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // ─── Export Handlers ─────────────────────────────────────────────────────

  const handleExportExcel = async () => {
    if (!medicalId) return;
    try {
      // Dynamic import to keep bundle smaller
      const XLSX = await import("xlsx");

      const range = datePreset === "custom"
        ? { start: new Date(customStart), end: new Date(customEnd) }
        : getDateRange(datePreset);

      const endOfDay = new Date(range.end);
      endOfDay.setHours(23, 59, 59, 999);
      const filtered = await getSalesInRange(medicalId, range.start, endOfDay);

      const salesRows = salesToCsvRows(filtered);
      const topRows = topMedicinesToCsvRows(topMedForExport);

      const wb = XLSX.utils.book_new();

      if (salesRows.length > 0) {
        const ws1 = XLSX.utils.json_to_sheet(salesRows);
        XLSX.utils.book_append_sheet(wb, ws1, "Sales Details");
      }

      if (topRows.length > 0) {
        const ws2 = XLSX.utils.json_to_sheet(topRows);
        XLSX.utils.book_append_sheet(wb, ws2, "Top Medicines");
      }

      XLSX.writeFile(wb, `Sales_Report_${formatDate(new Date())}.xlsx`);
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  const handleExportPdf = async () => {
    if (!medicalId || !summary) return;
    try {
      const { default: jsPDF } = await import("jspdf");
      await import("jspdf-autotable");

      const doc = new jsPDF();

      // Title
      doc.setFontSize(20);
      doc.setTextColor(30, 41, 59);
      doc.text("Sales Report", 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 30);

      // Summary
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text("Summary", 14, 42);
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      const sumLines = [
        `Total Sales: ₹${summary.totalSales.toLocaleString()}`,
        `Total Profit: ₹${summary.totalProfit.toLocaleString()}`,
        `Total Items Sold: ${summary.totalItemsSold}`,
        `Total Orders: ${summary.totalOrders}`,
        `Avg Order Value: ₹${summary.avgOrderValue.toLocaleString()}`,
      ];
      doc.text(sumLines, 14, 50);

      // Top Medicines Table
      if (sortedMedicines.length > 0) {
        const yPos = 50 + sumLines.length * 5 + 10;
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text("Top Medicines", 14, yPos);

        const tableData = sortedMedicines.slice(0, 20).map((m, i) => [
          String(i + 1),
          m.medicineName,
          String(m.quantitySold),
          `₹${m.totalRevenue.toLocaleString()}`,
          `₹${m.totalProfit.toLocaleString()}`,
        ]);

        (doc as any).autoTable({
          startY: yPos + 4,
          head: [["#", "Medicine", "Sold", "Revenue", "Profit"]],
          body: tableData,
          theme: "grid",
          headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          styles: { cellPadding: 2 },
        });
      }

      doc.save(`Sales_Report_${formatDate(new Date())}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
    }
  };

  // ─── Render helpers ──────────────────────────────────────────────────────

  const summaryCards = summary
    ? [
        {
          title: "Total Sales",
          value: `₹${summary.totalSales.toLocaleString()}`,
          icon: <ShoppingCart sx={{ fontSize: 22 }} />,
          color: "blue",
          bg: "bg-blue-50",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
        },
        {
          title: "Total Profit",
          value: `₹${summary.totalProfit.toLocaleString()}`,
          icon: <TrendingUp sx={{ fontSize: 22 }} />,
          color: "green",
          bg: "bg-emerald-50",
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-600",
        },
        {
          title: "Items Sold",
          value: summary.totalItemsSold.toLocaleString(),
          icon: <Inventory2 sx={{ fontSize: 22 }} />,
          color: "purple",
          bg: "bg-purple-50",
          iconBg: "bg-purple-100",
          iconColor: "text-purple-600",
        },
        {
          title: "Avg Order Value",
          value: `₹${summary.avgOrderValue.toLocaleString()}`,
          icon: <Receipt sx={{ fontSize: 22 }} />,
          color: "amber",
          bg: "bg-amber-50",
          iconBg: "bg-amber-100",
          iconColor: "text-amber-600",
        },
      ]
    : [];

  const totalCatRevenue = categorySales.reduce((s, c) => s + c.totalRevenue, 0);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          title="Reports"
          subtitle="Analyze your sales and business performance"
        />
        <div className="flex items-center gap-2">
          <Tooltip title="Export to Excel">
            <Button
              variant="outlined"
              size="small"
              startIcon={<TableChart />}
              onClick={handleExportExcel}
              sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 500 }}
            >
              Excel
            </Button>
          </Tooltip>
          <Tooltip title="Export to PDF">
            <Button
              variant="outlined"
              size="small"
              startIcon={<PictureAsPdf />}
              onClick={handleExportPdf}
              sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 500, color: "#DC2626", borderColor: "#FCA5A5" }}
            >
              PDF
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* ── Date Filter ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <CalendarMonth sx={{ fontSize: 20, color: "#64748B" }} />
        {(["today", "thisWeek", "thisMonth", "lastMonth"] as DatePreset[]).map((preset) => (
          <Chip
            key={preset}
            label={
              preset === "today" ? "Today" :
              preset === "thisWeek" ? "This Week" :
              preset === "thisMonth" ? "This Month" : "Last Month"
            }
            clickable
            onClick={() => setDatePreset(preset)}
            sx={{
              borderRadius: "8px",
              fontWeight: datePreset === preset ? 600 : 500,
              backgroundColor: datePreset === preset ? "#2563EB" : "#F1F5F9",
              color: datePreset === preset ? "white" : "#64748B",
              border: "1px solid",
              borderColor: datePreset === preset ? "#2563EB" : "#E2E8F0",
              transition: "all 0.2s",
              "&:hover": { backgroundColor: datePreset === preset ? "#1D4ED8" : "#E2E8F0" },
            }}
          />
        ))}
        <Chip
          label="Custom"
          clickable
          onClick={() => setDatePreset("custom")}
          sx={{
            borderRadius: "8px",
            fontWeight: datePreset === "custom" ? 600 : 500,
            backgroundColor: datePreset === "custom" ? "#2563EB" : "#F1F5F9",
            color: datePreset === "custom" ? "white" : "#64748B",
            border: "1px solid",
            borderColor: datePreset === "custom" ? "#2563EB" : "#E2E8F0",
          }}
        />

        {datePreset === "custom" && (
          <div className="flex items-center gap-2 ml-1">
            <TextField
              type="date"
              size="small"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  fontSize: 13,
                  width: 140,
                },
              }}
            />
            <span className="text-slate-400">to</span>
            <TextField
              type="date"
              size="small"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  fontSize: 13,
                  width: 140,
                },
              }}
            />
            <Button
              size="small"
              variant="contained"
              onClick={handleCustomDateChange}
              sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 500 }}
            >
              Apply
            </Button>
          </div>
        )}
      </div>

      {/* ── Loading Skeleton ────────────────────────────────────────────── */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={110} sx={{ borderRadius: "16px" }} />
          ))}
          <Skeleton variant="rounded" height={350} sx={{ borderRadius: "16px", gridColumn: "span 4" }} />
        </div>
      )}

      {/* ── Summary Cards ───────────────────────────────────────────────── */}
      {!loading && summary && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.title}
              className={`group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.title}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg} transition-transform group-hover:scale-110`}>
                  <span className={card.iconColor}>{card.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      {!loading && (
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Revenue Chart */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Revenue & Profit</h3>
                <p className="mt-1 text-sm text-slate-500">Daily sales and profit trends</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyRevenue} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <RechartTooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="profit" name="Profit" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                <Category sx={{ fontSize: 18, color: "#7C3AED" }} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Categories</h3>
                <p className="text-xs text-slate-500">Sales by category</p>
              </div>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySales.map((c) => ({ name: c.category, value: c.totalRevenue }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categorySales.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartTooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1.5">
              {categorySales.map((cat, i) => {
                const pct = totalCatRevenue > 0 ? ((cat.totalRevenue / totalCatRevenue) * 100).toFixed(1) : "0";
                return (
                  <div key={cat.category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-slate-600">{cat.category}</span>
                    </div>
                    <span className="font-medium text-slate-900">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Methods + Tables Row ─────────────────────────────────── */}
      {!loading && (
        <div className="grid gap-6 xl:grid-cols-4">
          {/* Payment Methods */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Payment Methods</h3>
            <div className="space-y-3">
              {paymentBreakdown.length === 0 && (
                <p className="text-sm text-slate-400 py-4 text-center">No data</p>
              )}
              {paymentBreakdown.map((p) => {
                const pct = summary?.totalSales
                  ? ((p.totalRevenue / summary.totalSales) * 100).toFixed(1)
                  : "0";
                return (
                  <div key={p.method} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">
                          {PAYMENT_ICONS[p.method] ?? <Receipt sx={{ fontSize: 18 }} />}
                        </span>
                        <span className="text-sm font-medium text-slate-700 capitalize">{p.method}</span>
                      </div>
                      <span className="text-xs text-slate-400">{p.count} orders</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-slate-900">₹{p.totalRevenue.toLocaleString()}</span>
                      <span className="text-xs font-medium text-slate-500">{pct}%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
                      <div
                        className="h-1.5 rounded-full bg-blue-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Medicines Table */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Top Selling Medicines</h3>
              <div className="flex items-center gap-2">
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as keyof TopMedicine)}
                    sx={{
                      borderRadius: "8px",
                      fontSize: 12,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E2E8F0" },
                    }}
                  >
                    <MenuItem value="totalRevenue">Revenue</MenuItem>
                    <MenuItem value="totalProfit">Profit</MenuItem>
                    <MenuItem value="quantitySold">Quantity</MenuItem>
                  </Select>
                </FormControl>
                <IconButton
                  size="small"
                  onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                  sx={{
                    transform: sortDir === "asc" ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                >
                  <ArrowUpward fontSize="small" />
                </IconButton>
              </div>
            </div>

            {sortedMedicines.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No sales data available</p>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: 11, color: "#64748B" }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: 11, color: "#64748B" }}>Medicine</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: 11, color: "#64748B" }} align="right"
                        onClick={() => toggleSort("quantitySold")}
                        className="cursor-pointer hover:text-blue-600 transition-colors"
                      >Qty Sold</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: 11, color: "#64748B" }} align="right"
                        onClick={() => toggleSort("totalRevenue")}
                        className="cursor-pointer hover:text-blue-600 transition-colors"
                      >Revenue</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: 11, color: "#64748B" }} align="right"
                        onClick={() => toggleSort("totalProfit")}
                        className="cursor-pointer hover:text-blue-600 transition-colors"
                      >Profit</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: 11, color: "#64748B" }} align="right">Margin</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedMedicines.map((med, i) => {
                      const margin = med.totalRevenue > 0
                        ? ((med.totalProfit / med.totalRevenue) * 100).toFixed(1)
                        : "0";
                      return (
                        <TableRow key={med.medicineName} hover sx={{ "&:hover": { backgroundColor: "#F8FAFC" } }}>
                          <TableCell sx={{ fontSize: 12, color: "#94A3B8" }}>{i + 1}</TableCell>
                          <TableCell>
                            <p className="text-sm font-medium text-slate-900">{med.medicineName}</p>
                            <p className="text-xs text-slate-400">{med.genericName}</p>
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: 13, fontWeight: 500 }}>{med.quantitySold}</TableCell>
                          <TableCell align="right" sx={{ fontSize: 13, fontWeight: 500 }}>
                            ₹{med.totalRevenue.toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: 13, fontWeight: 500, color: med.totalProfit >= 0 ? "#059669" : "#DC2626" }}>
                            ₹{med.totalProfit.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              Number(margin) >= 30
                                ? "bg-emerald-100 text-emerald-700"
                                : Number(margin) >= 15
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {margin}%
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        </div>
      )}

      {/* ── Empty State ─────────────────────────────────────────────────── */}
      {!loading && !summary && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white py-20 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
            <TrendingUp sx={{ fontSize: 32, color: "#CBD5E1" }} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No Data Available</h3>
          <p className="mt-2 max-w-sm text-center text-sm text-slate-500">
            Select a different date range or start making sales to see your reports here.
          </p>
        </div>
      )}
    </div>
  );
}
