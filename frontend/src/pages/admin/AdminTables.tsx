import { useState, useEffect } from "react";
import { fetchTables, patchTable } from "@/api/index.js";
import { getCurrentUser } from "../../auth/auth";
import { toast } from "sonner";
import {
    UtensilsCrossed,
    Save,
    Plus,
    Minus,
    Loader2,
    RefreshCcw
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminTables() {
    const user = getCurrentUser();
    const [tableConfig, setTableConfig] = useState<any>(null);
    const [tableCount, setTableCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        loadTableData();
    }, [user?.branch_id]);

    const loadTableData = async () => {
        setLoading(true);
        try {
            const tablesData = await fetchTables();
            const myBranchConfig = tablesData.find((t: any) => t.branch === user?.branch_id);
            if (myBranchConfig) {
                setTableConfig(myBranchConfig);
                setTableCount(myBranchConfig.table_count);
            }
        } catch (error) {
            console.error("Failed to fetch tables:", error);
            toast.error("Failed to load table configuration");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTableCount = async () => {
        if (!tableConfig) return;
        setIsUpdating(true);
        try {
            await patchTable(tableConfig.id, {
                branch: user?.branch_id,
                table_count: tableCount
            });
            toast.success("Table count updated successfully");
            loadTableData(); // Refresh to be safe
        } catch (error: any) {
            toast.error(error.message || "Failed to update table count");
        } finally {
            setIsUpdating(false);
        }
    };

    const generatedTables = Array.from({ length: tableCount }, (_, i) => ({
        id: i + 1,
        number: i + 1,
        status: 'available'
    }));

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Table Management</h1>
                    <p className="text-muted-foreground">Configure and manage your restaurant's physical layout</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadTableData} className="gap-2">
                    <RefreshCcw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Card */}
                <Card className="p-6 lg:col-span-1 h-fit">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <UtensilsCrossed className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Setup Tables</h3>
                            <p className="text-xs text-muted-foreground">Adjust the total number of tables</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Table Count</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setTableCount(Math.max(0, tableCount - 1))}
                                        className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm text-slate-500 hover:border-primary hover:text-primary transition-all active:scale-95"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="w-10 text-center text-xl font-black text-primary">{tableCount}</span>
                                    <button
                                        onClick={() => setTableCount(tableCount + 1)}
                                        className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm text-slate-500 hover:border-primary hover:text-primary transition-all active:scale-95"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground text-center">
                                This will update the table layout across Admin and Waiter apps.
                            </p>
                        </div>

                        <Button
                            className="w-full h-12 rounded-xl gradient-warm shadow-lg font-black uppercase tracking-wider gap-2"
                            onClick={handleUpdateTableCount}
                            disabled={isUpdating}
                        >
                            {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            Save Configuration
                        </Button>
                    </div>
                </Card>

                {/* Preview Card */}
                <Card className="p-6 lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold">Live Preview</h3>
                        <span className="text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                            Total: {tableCount}
                        </span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                        {generatedTables.length === 0 ? (
                            <div className="col-span-full py-12 text-center">
                                <p className="text-muted-foreground italic">No tables configured yet.</p>
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
