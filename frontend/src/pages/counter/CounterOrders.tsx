import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    ChevronLeft,
    Search,
    Clock,
    CheckCircle2,
    Printer,
    MoreHorizontal,
    Monitor,
    Calendar,
    Filter,
    Loader2,
    Banknote,
    QrCode,
    CreditCard
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { format, parseISO } from "date-fns";
import { fetchInvoices, addPayment } from "@/api/index.js";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function CounterOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Payment States
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "ONLINE" | "QR">("CASH");
    const [paymentNotes, setPaymentNotes] = useState("");
    const [isPaying, setIsPaying] = useState(false);

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const data = await fetchInvoices();
            setOrders(Array.isArray(data) ? data : []);
        } catch (err: any) {
            toast.error(err.message || "Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const handlePayOpen = (order: any) => {
        setSelectedOrder(order);
        setPaymentAmount(order.due_amount || (order.total_amount - (order.paid_amount || 0)));
        setPaymentMethod("CASH");
        setPaymentNotes("");
        setShowPaymentModal(true);
    };

    const handlePaymentSubmit = async () => {
        if (!selectedOrder) return;
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setIsPaying(true);
        try {
            await addPayment(selectedOrder.id, {
                amount: parseFloat(paymentAmount),
                payment_method: paymentMethod,
                notes: paymentNotes
            });
            toast.success("Payment added successfully");
            setShowPaymentModal(false);
            loadInvoices(); // Refresh list
        } catch (err: any) {
            toast.error(err.message || "Failed to process payment");
        } finally {
            setIsPaying(false);
        }
    };

    const filteredOrders = useMemo(() => {
        if (!Array.isArray(orders)) return [];
        return orders.filter(order =>
            (order.invoice_number?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (order.customer_name?.toLowerCase() || "").includes(searchQuery.toLowerCase())
        ).sort((a, b) => {
            const dateA = a.order_date ? new Date(a.order_date).getTime() : 0;
            const dateB = b.order_date ? new Date(b.order_date).getTime() : 0;
            return dateB - dateA;
        });
    }, [orders, searchQuery]);

    return (
        <div className="h-screen bg-stone-50 flex flex-col overflow-hidden font-sans">
            {/* Header */}
            <header className="h-16 bg-white border-b px-6 flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/counter/pos')} className="rounded-xl">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 h-10 w-10 rounded-xl flex items-center justify-center">
                            <Monitor className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-xl font-black text-slate-800">Order History</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center bg-slate-100 px-4 py-2 rounded-xl gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(), 'dd MMM yyyy')}
                    </div>
                </div>
            </header>

            {/* Toolbar */}
            <div className="p-6 shrink-0 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search by Order ID or Table Number..."
                        className="pl-12 h-14 text-lg rounded-2xl border-2 focus:border-primary bg-white shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="h-14 px-6 rounded-2xl font-bold border-2 hover:bg-slate-50 gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                </Button>
            </div>

            {/* Orders Table */}
            <main className="flex-1 overflow-hidden px-6 pb-6">
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 h-full flex flex-col overflow-hidden">
                    <div className="overflow-x-auto h-full custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white z-10 border-b">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Order ID</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Table / Mode</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Items</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Time</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                                                <p className="text-xl font-black text-slate-400">Loading orders...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-30">
                                                <Clock className="h-20 w-20" />
                                                <p className="text-xl font-black">No orders found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map(order => (
                                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <span className="font-mono text-sm font-bold text-slate-600">#{order.invoice_number}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-800">
                                                        {order.customer_name || 'Walk-in'}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.invoice_description || 'Sale'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col gap-1 max-w-[200px]">
                                                    {order.items?.slice(0, 2).map((item: any, i: number) => (
                                                        <span key={i} className="text-xs font-medium text-slate-600 truncate">
                                                            {item.quantity}x Product #{item.product}
                                                        </span>
                                                    ))}
                                                    {(order.items?.length || 0) > 2 && (
                                                        <span className="text-[10px] font-bold text-primary uppercase">+{order.items.length - 2} more items</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-sm font-medium text-slate-500">
                                                    {order.order_date ? format(parseISO(order.order_date), 'hh:mm a') : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="font-black text-slate-900 text-lg">Rs.{order.total_amount}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <StatusBadge status={(order.payment_status?.toLowerCase() || 'unpaid')} />
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100"
                                                        onClick={() => navigate(`/counter/pos`, { state: { orderId: order.id } })}
                                                        title="Print"
                                                    >
                                                        <Printer className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                    {(order.payment_status === 'UNPAID' || order.payment_status === 'PARTIAL') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="rounded-xl hover:bg-success/10 hover:shadow-md border border-transparent hover:border-success/20 group/pay"
                                                            onClick={() => handlePayOpen(order)}
                                                            title="Receive Payment"
                                                        >
                                                            <CheckCircle2 className="h-4 w-4 text-success group-hover/pay:scale-110 transition-transform" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100">
                                                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Payment Dialog */}
            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="max-w-[450px] p-0 overflow-hidden border-none shadow-3xl rounded-[2.5rem]">
                    <div className="p-8 space-y-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-slate-800">Add Payment</DialogTitle>
                            <p className="text-sm text-slate-400 font-medium">Adding payment for #{selectedOrder?.invoice_number}</p>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-400 font-black uppercase">Total Due</p>
                                    <p className="text-xl font-black text-slate-800">Rs.{selectedOrder?.due_amount || (selectedOrder ? (selectedOrder.total_amount - (selectedOrder.paid_amount || 0)) : 0)}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] text-slate-400 font-black uppercase">Customer</p>
                                    <p className="text-sm font-bold text-slate-600 truncate">{selectedOrder?.customer_name || 'Walk-in'}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Amount to Pay</Label>
                                <Input
                                    type="number"
                                    className="h-14 text-2xl font-black text-center border-2 border-primary/20 focus:border-primary rounded-xl"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Payment Method</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'CASH', icon: Banknote, label: 'Cash' },
                                        { id: 'QR', icon: QrCode, label: 'QR' },
                                        { id: 'ONLINE', icon: CreditCard, label: 'Online' }
                                    ].map((method) => (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id as any)}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1",
                                                paymentMethod === method.id ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400 hover:border-slate-200"
                                            )}
                                        >
                                            <method.icon className="h-5 w-5" />
                                            <span className="text-[10px] font-black uppercase">{method.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Notes (Optional)</Label>
                                <Input
                                    placeholder="Add any internal notes..."
                                    className="h-11 rounded-xl"
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                variant="ghost"
                                className="h-14 flex-1 rounded-xl font-bold text-slate-400"
                                onClick={() => setShowPaymentModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="h-14 flex-[2] rounded-xl font-black text-lg gradient-warm shadow-lg shadow-primary/20"
                                onClick={handlePaymentSubmit}
                                disabled={isPaying}
                            >
                                {isPaying ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>Confirm Payment</>
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
