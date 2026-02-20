import { useState, useEffect } from "react";
import { fetchTables, patchTable, createTable, deleteTable } from "@/api/index.js";
import { getCurrentUser } from "../../auth/auth";
import { toast } from "sonner";
import {
    UtensilsCrossed,
    Save,
    Plus,
    Minus,
    Loader2,
    RefreshCcw,
    Trash2,
    Layers
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminTables() {
    const user = getCurrentUser();
    const [floors, setFloors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newFloorName, setNewFloorName] = useState("");
    const [newFloorTableCount, setNewFloorTableCount] = useState(1);
    const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);

    useEffect(() => {
        loadTableData();
    }, [user?.branch_id]);

    const loadTableData = async () => {
        setLoading(true);
        try {
            const data = await fetchTables();
            // Data is filtered by branch in backend for managers/waiters
            // But for safety or if admin sees all, we might want to filter here or just show all
            setFloors(data || []);
            if (data && data.length > 0 && selectedFloorId === null) {
                const storedFloorId = localStorage.getItem('adminSelectedFloorId');
                if (storedFloorId) {
                    const found = data.find((f: any) => f.id.toString() === storedFloorId);
                    if (found) {
                        setSelectedFloorId(found.id);
                        return;
                    }
                }
                setSelectedFloorId(data[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch floors:", error);
            toast.error("Failed to load floor configuration");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateFloor = async (floor: any) => {
        setIsUpdating(floor.id);
        try {
            await patchTable(floor.id, {
                name: floor.name,
                table_count: floor.table_count
            });
            toast.success(`${floor.name} updated successfully`);
            loadTableData();
        } catch (error: any) {
            toast.error(error.message || "Failed to update floor");
        } finally {
            setIsUpdating(null);
        }
    };

    const handleCreateFloor = async () => {
        if (!newFloorName.trim()) {
            toast.error("Please enter a floor name");
            return;
        }
        try {
            await createTable({
                branch: user?.branch_id,
                name: newFloorName,
                table_count: newFloorTableCount
            });
            toast.success("Floor created successfully");
            setShowAddDialog(false);
            setNewFloorName("");
            setNewFloorTableCount(1);
            loadTableData();
        } catch (error: any) {
            toast.error(error.message || "Failed to create floor");
        }
    };

    const handleDeleteFloor = async (id: number) => {
        if (!confirm("Are you sure you want to delete this floor? All table configurations for this floor will be removed.")) return;
        try {
            await deleteTable(id);
            toast.success("Floor deleted successfully");
            loadTableData();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete floor");
        }
    };

    const updateFloorLocally = (id: number, field: string, value: any) => {
        setFloors(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
    };

    const handleFloorSelection = (id: number) => {
        setSelectedFloorId(id);
        localStorage.setItem('adminSelectedFloorId', id.toString());
    };

    const selectedFloor = floors.find(f => f.id === selectedFloorId);
    const generatedTables = selectedFloor ? Array.from({ length: selectedFloor.table_count }, (_, i) => ({
        id: i + 1,
        number: i + 1,
        status: 'available'
    })) : [];

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Floor & Table Management</h1>
                    <p className="text-muted-foreground">Manage floors and table layouts for your branch</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={loadTableData} className="gap-2">
                        <RefreshCcw className="h-4 w-4" />
                        Refresh
                    </Button>
                    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 gradient-warm">
                                <Plus className="h-4 w-4" />
                                Add Floor
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Floor</DialogTitle>
                                <DialogDescription>Create a new floor section for your branch.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Floor Name</label>
                                    <Input
                                        placeholder="e.g. Ground Floor, Roof Top"
                                        value={newFloorName}
                                        onChange={(e) => setNewFloorName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Table Count</label>
                                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border">
                                        <button
                                            onClick={() => setNewFloorTableCount(Math.max(1, newFloorTableCount - 1))}
                                            className="h-8 w-8 bg-white border rounded-lg flex items-center justify-center"
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="w-10 text-center font-bold">{newFloorTableCount}</span>
                                        <button
                                            onClick={() => setNewFloorTableCount(newFloorTableCount + 1)}
                                            className="h-8 w-8 bg-white border rounded-lg flex items-center justify-center"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                                <Button onClick={handleCreateFloor}>Create Floor</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Floors List */}
                <Card className="p-6 lg:col-span-12 xl:col-span-5 h-fit">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Layers className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Floors List</h3>
                            <p className="text-xs text-muted-foreground">Manage table counts for each floor</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {floors.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed">
                                <p className="text-sm text-muted-foreground">No floors configured. Click "Add Floor" to start.</p>
                            </div>
                        ) : (
                            floors.map((floor) => (
                                <div
                                    key={floor.id}
                                    className={`p-4 rounded-2xl border transition-all ${selectedFloorId === floor.id ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                                    onClick={() => handleFloorSelection(floor.id)}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    value={floor.name}
                                                    onChange={(e) => updateFloorLocally(floor.id, 'name', e.target.value)}
                                                    className="h-8 font-bold border-none bg-transparent hover:bg-slate-100/50 p-2 focus-visible:ring-1 focus-visible:ring-primary/20"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg border text-xs">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateFloorLocally(floor.id, 'table_count', Math.max(0, floor.table_count - 1));
                                                        }}
                                                        className="h-6 w-6 bg-white border rounded flex items-center justify-center hover:text-primary"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="w-8 text-center font-bold text-slate-700">{floor.table_count}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateFloorLocally(floor.id, 'table_count', floor.table_count + 1);
                                                        }}
                                                        className="h-6 w-6 bg-white border rounded flex items-center justify-center hover:text-primary"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                    <span className="text-slate-400 uppercase font-black text-[8px] ml-1">Tables</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-10 w-10 text-slate-400 hover:text-primary hover:bg-primary/5"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUpdateFloor(floor);
                                                }}
                                                disabled={isUpdating === floor.id}
                                            >
                                                {isUpdating === floor.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-10 w-10 text-slate-400 hover:text-destructive hover:bg-destructive/5"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteFloor(floor.id);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Preview Card */}
                <Card className="p-6 lg:col-span-12 xl:col-span-7">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                                <UtensilsCrossed className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold">{selectedFloor?.name || "Select a Floor"}</h3>
                                <p className="text-xs text-muted-foreground">Live preview of table layout</p>
                            </div>
                        </div>
                        {selectedFloor && (
                            <span className="text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                Total Tables: {selectedFloor.table_count}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                        {!selectedFloor ? (
                            <div className="col-span-full py-12 text-center">
                                <p className="text-muted-foreground italic">Select a floor from the list to see the layout.</p>
                            </div>
                        ) : generatedTables.length === 0 ? (
                            <div className="col-span-full py-12 text-center">
                                <p className="text-muted-foreground italic">No tables configured for this floor.</p>
                            </div>
                        ) : generatedTables.map((table) => (
                            <div
                                key={table.id}
                                className="aspect-square rounded-2xl flex flex-col items-center justify-center text-sm font-black bg-white border-2 border-primary/20 text-primary shadow-sm hover:border-primary transition-all hover:shadow-md cursor-default group"
                            >
                                <span className="opacity-40 text-[10px] uppercase font-black mb-1 group-hover:opacity-100 transition-opacity">TBL</span>
                                {table.number}
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
