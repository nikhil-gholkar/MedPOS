import { useEffect, useMemo, useState } from "react";

import {
  Button,
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
import StatsCard from "../../components/ui/StatsCard";
import StatsStrip from "../../components/ui/StatsStrip";
import { useAppSelector } from "../../hooks/reduxHooks";
import { CATEGORY_META } from "../../features/inventory/categoryMeta";
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

const PRESET_LABELS: Record<Exclude<DatePreset, "custom">, string> = {
  today: "Today",
  thisWeek: "This week",
  thisMonth: "This month",
  lastMonth: "Last month",
};

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

// ─── Chart colors ──────────────────────────────────────────────────────────

const FALLBACK_CHART_COLOR = "#6B7873";

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  cash: <LocalAtm sx={{ fontSize: 16 }} />,
  card: <CreditCard sx={{ fontSize: 16 }} />,
  upi: <PhoneIphone sx={{ fontSize: 16 }} />,
  other: <Receipt sx={{ fontSize: 16 }} />,
};

// ─── Chart tooltip ─────────────────────────────────────────────────────────

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value: number | string; color?: string }>;
  label?: string | number;
}

const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-ctl border border-line bg-white px-3 py-2 shadow-[0_4px_12px_rgba(16,32,28,0.08)]">
        {label !== undefined && (
          <p className="mb-1 text-[11px] font-medium text-ink-mute">{label}</p>
        )}
        {payload.map((entry, i) => (
          <p key={i} className="tnum text-[13px] font-semibold" style={{ color: entry.color }}>
            {entry.name}: ₹{Number(entry.value).toLocaleString("en-IN")}
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

  const loadData = async (preset: DatePreset, start = "", end = "") => {
    if (!medicalId) return;

    try {
      const range =
        preset === "custom"
          ? { start: new Date(start), end: new Date(end) }
          : getDateRange(preset);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state updates run after the fetch resolves
    loadData(datePreset, customStart, customEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicalId, datePreset]);

  const selectPreset = (preset: DatePreset) => {
    setLoading(true);
    setDatePreset(preset);
  };

  const handleCustomDateChange = () => {
    if (customStart && customEnd && new Date(customStart) <= new Date(customEnd)) {
      setLoading(true);
      loadData("custom", customStart, customEnd);
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
      const XLSX = await import("xlsx");

      const range =
        datePreset === "custom"
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

      doc.setFontSize(20);
      doc.setTextColor(30, 41, 59);
      doc.text("Sales Report", 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 30);

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

        // jsPDF-autotable attaches autoTable() to the instance via side-effect import
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (doc as any).autoTable({
          startY: yPos + 4,
          head: [["#", "Medicine", "Sold", "Revenue", "Profit"]],
          body: tableData,
          theme: "grid",
          headStyles: { fillColor: [15, 118, 110], fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          styles: { cellPadding: 2 },
        });
      }

      doc.save(`Sales_Report_${formatDate(new Date())}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
    }
  };

  // ─── Derived ─────────────────────────────────────────────────────────────

  const totalCatRevenue = categorySales.reduce((s, c) => s + c.totalRevenue, 0);
  const hasData = !loading && summary !== null && summary.totalOrders > 0;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Sales, profit and stock movement for any date range"
        action={
          <>
            <Tooltip title="Export sales and top medicines to Excel">
              <Button variant="outlined" startIcon={<TableChart />} onClick={handleExportExcel}>
                Excel
              </Button>
            </Tooltip>
            <Tooltip title="Export a printable PDF summary">
              <Button
                variant="outlined"
                startIcon={<PictureAsPdf />}
                onClick={handleExportPdf}
                disabled={!summary}
              >
                PDF
              </Button>
            </Tooltip>
          </>
        }
      />

      {/* Date range filter */}
      <div className="rounded-card border border-line bg-white p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <CalendarMonth sx={{ fontSize: 18, color: "#8A968F" }} />

          <div
            className="flex flex-wrap items-center gap-1 rounded-ctl border border-line bg-canvas p-1"
            role="group"
            aria-label="Select date range"
          >
            {(Object.keys(PRESET_LABELS) as Array<Exclude<DatePreset, "custom">>).map((preset) => {
              const active = datePreset === preset;
              return (
                <button
                  key={preset}
                  onClick={() => selectPreset(preset)}
                  aria-pressed={active}
                  className={`rounded-chip border px-2.5 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "border-line bg-white text-ink shadow-[0_1px_2px_rgba(16,32,28,0.06)]"
                      : "border-transparent text-ink-soft hover:text-ink"
                  }`}
                >
                  {PRESET_LABELS[preset]}
                </button>
              );
            })}
            <button
              onClick={() => selectPreset("custom")}
              aria-pressed={datePreset === "custom"}
              className={`rounded-chip border px-2.5 py-1 text-xs font-medium transition-colors ${
                datePreset === "custom"
                  ? "border-line bg-white text-ink shadow-[0_1px_2px_rgba(16,32,28,0.06)]"
                  : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              Custom
            </button>
          </div>

          {datePreset === "custom" && (
            <div className="flex flex-wrap items-center gap-2">
              <TextField
                type="date"
                size="small"
                aria-label="Start date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                sx={{ width: 150 }}
              />
              <span className="text-xs text-ink-mute">to</span>
              <TextField
                type="date"
                size="small"
                aria-label="End date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                sx={{ width: 150 }}
              />
              <Button
                size="small"
                variant="contained"
                onClick={handleCustomDateChange}
                disabled={!customStart || !customEnd}
              >
                Apply
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-5 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={110} sx={{ bgcolor: "#EDF1EF" }} />
          ))}
        </div>
      )}

      {/* Summary strip */}
      {!loading && summary && (
        <div className="mt-5">
          <StatsStrip>
            <StatsCard
              title="Sales"
              value={`₹${summary.totalSales.toLocaleString("en-IN")}`}
              icon={<ShoppingCart sx={{ fontSize: 18 }} />}
              hint={`${summary.totalOrders} order${summary.totalOrders !== 1 ? "s" : ""} in range`}
            />
            <StatsCard
              title="Profit"
              value={`₹${summary.totalProfit.toLocaleString("en-IN")}`}
              icon={<TrendingUp sx={{ fontSize: 18 }} />}
              tone={summary.totalProfit >= 0 ? "ok" : "danger"}
              hint={
                summary.totalSales > 0
                  ? `${Math.round((summary.totalProfit / summary.totalSales) * 100)}% margin`
                  : "No margin recorded"
              }
            />
            <StatsCard
              title="Items sold"
              value={summary.totalItemsSold.toLocaleString("en-IN")}
              icon={<Inventory2 sx={{ fontSize: 18 }} />}
              hint="Units dispensed in range"
            />
            <StatsCard
              title="Avg order value"
              value={`₹${summary.avgOrderValue.toLocaleString("en-IN")}`}
              icon={<Receipt sx={{ fontSize: 18 }} />}
              hint="Per completed sale"
            />
          </StatsStrip>
        </div>
      )}

      {/* Charts */}
      {!loading && (
        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          <section className="rounded-card border border-line bg-white xl:col-span-2">
            <div className="border-b border-line px-4 py-3 md:px-5">
              <h2 className="text-[15px] font-semibold text-ink">Revenue &amp; profit</h2>
              <p className="mt-0.5 text-xs text-ink-soft">Daily totals in the selected range</p>
            </div>
            <div className="h-[300px] w-full px-2 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyRevenue} margin={{ top: 5, right: 10, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDF1EF" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#8A968F" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8A968F" }} />
                  <RechartTooltip content={<ChartTooltip />} cursor={{ fill: "#F3F5F4" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#0F766E" radius={[3, 3, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="profit" name="Profit" fill="#157F3D" radius={[3, 3, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-card border border-line bg-white">
            <div className="border-b border-line px-4 py-3 md:px-5">
              <h2 className="text-[15px] font-semibold text-ink">Sales by category</h2>
              <p className="mt-0.5 text-xs text-ink-soft">Share of revenue</p>
            </div>

            {categorySales.length === 0 ? (
              <div className="px-4 py-12 text-center md:px-5">
                <p className="text-[13px] text-ink-soft">No category data in this range.</p>
              </div>
            ) : (
              <div className="px-2 pt-4">
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categorySales.map((c) => ({ name: c.category, value: c.totalRevenue }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={82}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categorySales.map((c, i) => (
                          <Cell
                            key={i}
                            fill={CATEGORY_META[c.category as keyof typeof CATEGORY_META]?.color ?? FALLBACK_CHART_COLOR}
                          />
                        ))}
                      </Pie>
                      <RechartTooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 px-4 pb-4 pt-2">
                  {categorySales.map((cat) => {
                    const pct =
                      totalCatRevenue > 0
                        ? ((cat.totalRevenue / totalCatRevenue) * 100).toFixed(1)
                        : "0";
                    return (
                      <div key={cat.category} className="flex items-center justify-between text-[13px]">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                CATEGORY_META[cat.category as keyof typeof CATEGORY_META]?.color ??
                                FALLBACK_CHART_COLOR,
                            }}
                          />
                          <span className="text-ink-soft">{cat.category}</span>
                        </span>
                        <span className="tnum font-medium text-ink">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Payment methods + top medicines */}
      {!loading && (
        <div className="mt-5 grid gap-5 xl:grid-cols-4">
          <section className="rounded-card border border-line bg-white">
            <div className="border-b border-line px-4 py-3 md:px-5">
              <h2 className="text-[15px] font-semibold text-ink">Payment methods</h2>
              <p className="mt-0.5 text-xs text-ink-soft">Share of revenue</p>
            </div>

            <div className="divide-y divide-line px-4 md:px-5">
              {paymentBreakdown.length === 0 && (
                <p className="py-8 text-center text-[13px] text-ink-mute">No data in range</p>
              )}
              {paymentBreakdown.map((p) => {
                const pct = summary?.totalSales
                  ? ((p.totalRevenue / summary.totalSales) * 100).toFixed(1)
                  : "0";
                return (
                  <div key={p.method} className="py-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[13px] font-medium capitalize text-ink">
                        <span className="text-ink-soft">
                          {PAYMENT_ICONS[p.method] ?? <Receipt sx={{ fontSize: 16 }} />}
                        </span>
                        {p.method}
                      </span>
                      <span className="tnum text-[13px] font-semibold text-ink">
                        ₹{p.totalRevenue.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-canvas">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="tnum shrink-0 text-[11px] text-ink-mute">
                        {pct}% · {p.count} order{p.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-card border border-line bg-white xl:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 md:px-5">
              <div>
                <h2 className="text-[15px] font-semibold text-ink">Top selling medicines</h2>
                <p className="mt-0.5 text-xs text-ink-soft">Ranked by revenue in range</p>
              </div>
              <div className="flex items-center gap-1.5">
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as keyof TopMedicine)}
                    aria-label="Sort by"
                  >
                    <MenuItem value="totalRevenue">Revenue</MenuItem>
                    <MenuItem value="totalProfit">Profit</MenuItem>
                    <MenuItem value="quantitySold">Quantity</MenuItem>
                  </Select>
                </FormControl>
                <Tooltip title={sortDir === "desc" ? "Descending" : "Ascending"}>
                  <IconButton
                    size="small"
                    onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                    aria-label="Toggle sort direction"
                    sx={{
                      transform: sortDir === "asc" ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                      color: "#4E5D57",
                    }}
                  >
                    <ArrowUpward fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
            </div>

            {sortedMedicines.length === 0 ? (
              <p className="py-12 text-center text-[13px] text-ink-mute">
                No sales recorded in this range.
              </p>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Medicine</TableCell>
                      <TableCell align="right" onClick={() => toggleSort("quantitySold")} className="cursor-pointer hover:text-primary">
                        Qty sold
                      </TableCell>
                      <TableCell align="right" onClick={() => toggleSort("totalRevenue")} className="cursor-pointer hover:text-primary">
                        Revenue
                      </TableCell>
                      <TableCell align="right" onClick={() => toggleSort("totalProfit")} className="cursor-pointer hover:text-primary">
                        Profit
                      </TableCell>
                      <TableCell align="right">Margin</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedMedicines.map((med, i) => {
                      const margin =
                        med.totalRevenue > 0
                          ? ((med.totalProfit / med.totalRevenue) * 100).toFixed(1)
                          : "0";
                      const marginClass =
                        Number(margin) >= 30
                          ? "border-ok/25 bg-ok-soft text-ok"
                          : Number(margin) >= 15
                          ? "border-warn/25 bg-warn-soft text-warn"
                          : "border-danger/25 bg-danger-soft text-danger";
                      return (
                        <TableRow key={med.medicineName} hover>
                          <TableCell className="tnum" sx={{ color: "#8A968F" }}>
                            {i + 1}
                          </TableCell>
                          <TableCell>
                            <p className="text-[13px] font-medium text-ink">{med.medicineName}</p>
                            <p className="text-xs text-ink-mute">{med.genericName}</p>
                          </TableCell>
                          <TableCell align="right" className="tnum font-medium">
                            {med.quantitySold}
                          </TableCell>
                          <TableCell align="right" className="tnum font-medium">
                            ₹{med.totalRevenue.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell
                            align="right"
                            className={`tnum font-medium ${
                              med.totalProfit >= 0 ? "text-ok" : "text-danger"
                            }`}
                          >
                            ₹{med.totalProfit.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell align="right">
                            <span
                              className={`inline-flex items-center rounded-chip border px-1.5 py-0.5 text-[11px] font-medium ${marginClass}`}
                            >
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
          </section>
        </div>
      )}

      {/* Empty state */}
      {!loading && !hasData && summary !== null && (
        <div className="mt-5 flex flex-col items-center justify-center rounded-card border border-line bg-white px-6 py-16 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-ctl bg-canvas">
            <TrendingUp sx={{ fontSize: 20, color: "#8A968F" }} />
          </span>
          <h3 className="mt-3 text-[15px] font-semibold text-ink">No sales in this range</h3>
          <p className="mt-1 max-w-sm text-[13px] text-ink-soft">
            Pick a different date range, or complete a sale at the counter to see it here.
          </p>
        </div>
      )}
    </div>
  );
}
