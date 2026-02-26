import { useState, useEffect } from "react";
import {
    Users,
    Search,
    Plus,
    Mail,
    Phone,
    ShoppingBag,
    Calendar,
    ChevronRight,
    MoreVertical,
    Download,
    Filter,
    Eye,
    Loader2,
    Trash2
} from "lucide-react";
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from "../../api/index.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from "@/components/ui/sheet";
import { toast } from "sonner";

// Define interface matching local needs but populated from API
interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string;
    branch: number;
}

export default function AdminCustomers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [editing, setEditing] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Edit Customer State
    const [editCustomer, setEditCustomer] = useState<{
        name: string;
        email: string;
        phone: string;
        address: string;
    } | null>(null);

    // New Customer State
    const [newCustomer, setNewCustomer] = useState({
        name: "",
        email: "",
        phone: "",
        address: ""
    });

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const data = await fetchCustomers();
            // Map API data to our interface, providing defaults for missing fields
            const mapped: Customer[] = data.map((c: any) => ({
                id: c.id,
                name: c.name,
                email: c.email || "N/A",
                phone: c.phone || "N/A",
                address: c.address || "",
                totalOrders: 0, // Placeholder
                totalSpent: 0,  // Placeholder
                lastOrderDate: c.date ? new Date(c.date).toLocaleDateString() : "N/A",
                branch: c.branch
            }));
            setCustomers(mapped);
        } catch (err: any) {
            toast.error(err.message || "Failed to load customers");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCustomer = async () => {
        if (!newCustomer.name || !newCustomer.phone) {
            toast.error("Name and Phone are required");
            return;
        }

        setCreating(true);
        try {
            await createCustomer(newCustomer);
            toast.success("Customer created successfully");
            setIsAddModalOpen(false);
            setNewCustomer({ name: "", email: "", phone: "", address: "" }); // Reset form
            loadCustomers(); // Refresh list
        } catch (err: any) {
            toast.error(err.message || "Failed to create customer");
        } finally {
            setCreating(false);
        }
    };

    const handleEditCustomer = async () => {
        if (!selectedCustomer || !editCustomer) return;

        if (!editCustomer.name || !editCustomer.phone) {
            toast.error("Name and Phone are required");
            return;
        }

        setEditing(true);
        try {
            await updateCustomer(selectedCustomer.id, editCustomer);
            toast.success("Customer updated successfully");
            setIsEditMode(false);
            setEditCustomer(null);
            loadCustomers(); // Refresh list
        } catch (err: any) {
            toast.error(err.message || "Failed to update customer");
        } finally {
            setEditing(false);
        }
    };

    const handleDeleteCustomer = async (id: number) => {
        if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) return;

        setDeleting(true);
        try {
            await deleteCustomer(id);
            toast.success("Customer deleted successfully");
            setSelectedCustomer(null); // Close sheet
            loadCustomers(); // Refresh list
        } catch (err: any) {
            toast.error(err.message || "Failed to delete customer");
        } finally {
            setDeleting(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Customers</h1>
                    <p className="text-sm md:text-base text-muted-foreground">Manage your customer database and purchase history.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Customer
                    </Button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email or phone..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                    </Button>
                    <div className="h-8 w-[1px] bg-border hidden md:block mx-2" />
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                        Showing <span className="font-medium text-foreground">{filteredCustomers.length}</span> customers
                    </p>
                </div>
            </div>

            {/* Customer Table */}
            <div className="card-elevated p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/40 text-muted-foreground uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Total Orders</th>
                                <th className="px-6 py-4">Total Spent</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        Loading customers...
                                    </td>
                                </tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                                        No customers found.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr
                                        key={customer.id}
                                        className="hover:bg-muted/30 transition-colors group cursor-pointer"
                                        onClick={() => setSelectedCustomer(customer)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                    {customer.name && customer.name.length > 0 ? customer.name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <span className="font-semibold text-foreground">{customer.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-xs space-y-1">
                                                {customer.email !== "N/A" && (
                                                    <span className="text-foreground flex items-center gap-1">
                                                        <Mail className="h-3 w-3 text-muted-foreground" /> {customer.email}
                                                    </span>
                                                )}
                                                {customer.phone !== "N/A" && (
                                                    <span className="text-muted-foreground flex items-center gap-1">
                                                        <Phone className="h-3 w-3 text-muted-foreground" /> {customer.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                                {customer.totalOrders} (No data)
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-muted-foreground/50">
                                            Rs.{customer.totalSpent.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground truncate">
                                            <StatusBadge status="active" />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Customer Detail Sheet */}
            <Sheet open={!!selectedCustomer} onOpenChange={() => {
                setSelectedCustomer(null);
                setIsEditMode(false);
                setEditCustomer(null);
            }}>
                <SheetContent className="sm:max-w-xl overflow-y-auto">
                    {selectedCustomer && (
                        <div className="space-y-8 py-6">
                            <SheetHeader>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                                        {selectedCustomer.name && selectedCustomer.name.length > 0 ? selectedCustomer.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div>
                                        <SheetTitle className="text-2xl">{selectedCustomer.name}</SheetTitle>
                                        <SheetDescription>{selectedCustomer.email}</SheetDescription>
                                    </div>
                                </div>
                            </SheetHeader>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-muted/50 p-6 rounded-xl text-center">
                                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Total Revenue</p>
                                    <p className="font-bold text-2xl text-muted-foreground/50">Rs.{selectedCustomer.totalSpent.toLocaleString()}</p>
                                </div>
                                <div className="bg-muted/50 p-6 rounded-xl text-center">
                                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Orders</p>
                                    <p className="font-bold text-2xl text-muted-foreground/50">{selectedCustomer.totalOrders}</p>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2 text-foreground">
                                    <Users className="h-4 w-4 text-primary" />
                                    Contact Information
                                </h4>
                                {isEditMode ? (
                                    <div className="grid gap-4 p-4 border border-border rounded-xl bg-card">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground">Full Name <span className="text-red-500">*</span></label>
                                            <Input
                                                value={editCustomer?.name || ""}
                                                onChange={(e) => setEditCustomer(prev => prev ? { ...prev, name: e.target.value } : null)}
                                                placeholder="Customer name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground">Email</label>
                                            <Input
                                                type="email"
                                                value={editCustomer?.email || ""}
                                                onChange={(e) => setEditCustomer(prev => prev ? { ...prev, email: e.target.value } : null)}
                                                placeholder="email@example.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground">Phone <span className="text-red-500">*</span></label>
                                            <Input
                                                value={editCustomer?.phone || ""}
                                                onChange={(e) => setEditCustomer(prev => prev ? { ...prev, phone: e.target.value } : null)}
                                                placeholder="Phone number"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground">Address</label>
                                            <Input
                                                value={editCustomer?.address || ""}
                                                onChange={(e) => setEditCustomer(prev => prev ? { ...prev, address: e.target.value } : null)}
                                                placeholder="Customer address"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid gap-3 p-4 border border-border rounded-xl bg-card">
                                        <div className="flex items-center gap-3 text-sm">
                                            <Mail className="h-4 w-4 text-primary/70" />
                                            <span>{selectedCustomer.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <Phone className="h-4 w-4 text-primary/70" />
                                            <span>{selectedCustomer.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <Users className="h-4 w-4 text-primary/70" />
                                            <span>Active Customer</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                {isEditMode ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => {
                                                setIsEditMode(false);
                                                setEditCustomer(null);
                                            }}
                                            disabled={editing}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="flex-1 shadow-md"
                                            onClick={handleEditCustomer}
                                            disabled={editing}
                                        >
                                            {editing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                            {editing ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            className="flex-1 shadow-md"
                                            onClick={() => {
                                                setIsEditMode(true);
                                                setEditCustomer({
                                                    name: selectedCustomer.name,
                                                    email: selectedCustomer.email,
                                                    phone: selectedCustomer.phone,
                                                    address: selectedCustomer.address
                                                });
                                            }}
                                        >
                                            Edit Profile
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                                            onClick={() => selectedCustomer && handleDeleteCustomer(selectedCustomer.id)}
                                            disabled={deleting}
                                        >
                                            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                            {deleting ? "Deleting..." : "Delete Customer"}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Add Customer Modal (Static UI) */}
            <Sheet open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <SheetContent side="right" className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Add New Customer</SheetTitle>
                        <SheetDescription>Create a new profile to track customer orders and history.</SheetDescription>
                    </SheetHeader>
                    <div className="space-y-6 py-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name <span className="text-red-500">*</span></label>
                                <Input
                                    placeholder="John Doe"
                                    value={newCustomer.name}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email Address</label>
                                <Input
                                    type="email"
                                    placeholder="john@example.com"
                                    value={newCustomer.email}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Phone Number <span className="text-red-500">*</span></label>
                                <Input
                                    placeholder="+977 98XXXXXXX"
                                    value={newCustomer.phone}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Address (Optional)</label>
                                <Input
                                    placeholder="Enter street address"
                                    value={newCustomer.address}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" className="flex-1" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                            <Button className="flex-1" onClick={handleCreateCustomer} disabled={creating}>
                                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {creating ? "Saving..." : "Save Customer"}
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
