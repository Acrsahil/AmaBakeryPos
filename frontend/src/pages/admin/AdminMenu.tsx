import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Pencil, Trash2, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { fetchProducts, createProduct, updateProduct, deleteProduct, fetchCategories, createCategory, deleteCategory } from "../../api/index.js";

interface Product {
  id: number;
  name: string;
  cost_price: string;
  selling_price: string;
  product_quantity: number;
  low_stock_bar: number;
  category: number; // This is the ID
  category_name: string;
  branch_id: number;
  branch_name: string;
  date_added: string;
  available?: boolean;
}

interface BackendCategory {
  id: number;
  name: string;
  branch: number;
  branch_name: string;
}

export default function AdminMenu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Categories Management
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [newCategoryInput, setNewCategoryInput] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        fetchProducts(),
        fetchCategories()
      ]);

      const initialized = productsData.map((p: Product) => ({
        ...p,
        available: p.product_quantity > 0
      }));
      setProducts(initialized);
      setCategories(categoriesData);
    } catch (err: any) {
      toast.error("Failed to load data", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = products.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category_name === categoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const handleToggleAvailability = (productId: number) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, available: !p.available } : p
    ));
    toast.success("Availability updated");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      cost_price: formData.get("cost_price"),
      selling_price: formData.get("selling_price"),
      product_quantity: parseInt(formData.get("product_quantity") as string),
      low_stock_bar: parseInt(formData.get("low_stock_bar") as string),
      category: parseInt(formData.get("category") as string),
    };

    try {
      if (editItem) {
        const updated = await updateProduct(editItem.id, payload);
        const withAvailable = { ...updated, available: updated.product_quantity > 0 };
        setProducts(prev => prev.map(p => p.id === editItem.id ? withAvailable : p));
        toast.success("Item updated");
      } else {
        const newProduct = await createProduct(payload);
        const withAvailable = { ...newProduct, available: newProduct.product_quantity > 0 };
        setProducts(prev => [...prev, withAvailable]);
        toast.success("Item added");
      }
      setIsDialogOpen(false);
      setEditItem(null);
    } catch (err: any) {
      toast.error("Operation failed", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success("Item deleted");
    } catch (err: any) {
      toast.error("Delete failed", { description: err.message });
    }
  };

  const handleAddCategory = async () => {
    if (newCategoryInput.trim()) {
      try {
        const newCat = await createCategory({ name: newCategoryInput.trim() });
        setCategories(prev => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
        setNewCategoryInput("");
        toast.success("Category added");
      } catch (err: any) {
        toast.error("Failed to add category", { description: err.message });
      }
    }
  };

  const handleDeleteCategory = async (catId: number, catName: string) => {
    const isInUse = products.some(item => item.category === catId);
    if (isInUse) {
      toast.error("Cannot delete category attached to existing items");
      return;
    }

    if (!confirm(`Are you sure you want to delete category "${catName}"?`)) return;

    try {
      await deleteCategory(catId);
      setCategories(prev => prev.filter(c => c.id !== catId));
      toast.success("Category deleted");
    } catch (err: any) {
      toast.error("Failed to delete category", { description: err.message });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Menu Management</h1>
          <p className="text-sm text-muted-foreground">Manage your bakery items and categories</p>
        </div>
      </div>

      <Tabs defaultValue="items" className="w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4">
          <TabsList className="grid w-full grid-cols-2 max-w-full sm:max-w-[300px]">
            <TabsTrigger value="items">Menu Items</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto" onClick={() => setEditItem(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Item Name</Label>
                  <Input id="name" name="name" placeholder="Enter item name" defaultValue={editItem?.name} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cost_price">Cost Price (Rs.)</Label>
                    <Input id="cost_price" name="cost_price" type="number" step="0.01" placeholder="0.00" defaultValue={editItem?.cost_price} required />
                  </div>
                  <div>
                    <Label htmlFor="selling_price">Selling Price (Rs.)</Label>
                    <Input id="selling_price" name="selling_price" type="number" step="0.01" placeholder="0.00" defaultValue={editItem?.selling_price} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product_quantity">Initial Stock</Label>
                    <Input id="product_quantity" name="product_quantity" type="number" placeholder="0" defaultValue={editItem?.product_quantity} required />
                  </div>
                  <div>
                    <Label htmlFor="low_stock_bar">Low Stock Threshold</Label>
                    <Input id="low_stock_bar" name="low_stock_bar" type="number" placeholder="0" defaultValue={editItem?.low_stock_bar} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue={editItem?.category?.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (editItem ? 'Update' : 'Add')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="items" className="space-y-4 mt-0">
          {/* Filters */}
          <div className="space-y-4">
            <div className="card-elevated p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                variant={categoryFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter('all')}
                className="whitespace-nowrap rounded-full"
              >
                All
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={categoryFilter === cat.name ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter(cat.name)}
                  className="whitespace-nowrap rounded-full font-medium"
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`card-elevated p-4 ${!item.available && 'opacity-60'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.category_name}</p>
                    </div>
                    <span className="text-lg font-bold text-primary">Rs.{item.selling_price}</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.available}
                        onCheckedChange={() => handleToggleAvailability(item.id)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {item.available ? 'Available' : 'Out of stock'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditItem(item);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div className="card-elevated py-12 text-center text-muted-foreground">
              No items found matching your criteria
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-6 mt-6">
          <div className="card-elevated p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Manage Categories</h2>
            <div className="flex gap-4 mb-6">
              <Input
                placeholder="Enter new category name..."
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
              />
              <Button onClick={handleAddCategory} className="font-bold">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-bold text-muted-foreground bg-slate-100/50 rounded-lg">
                <div className="col-span-6">Category Name</div>
                <div className="col-span-6 text-right">Actions</div>
              </div>
              {categories.map((category) => (
                <div key={category.id} className="grid grid-cols-12 gap-4 items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                  <div className="col-span-6 font-medium">{category.name}</div>
                  <div className="col-span-6 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all h-8 w-8 p-0"
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
