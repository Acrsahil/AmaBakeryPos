import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Bell,
  User as UserIcon,
  LogOut,
  Settings,
  HelpCircle,
  MapPin
} from "lucide-react";
import { toast } from "sonner";
import { branches, User } from "@/lib/mockData";
import { logout } from "@/auth/auth";


interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  showNotification?: boolean;
  notificationCount?: number;
}

export function MobileHeader({ title, showBack = false, showNotification = true, notificationCount = 0 }: MobileHeaderProps) {
  const navigate = useNavigate();

  // Get current user and branch
  const storedUser = localStorage.getItem('currentUser');
  const user: User | null = storedUser ? JSON.parse(storedUser) : null;
  const branch = branches.find(b => b.id === user?.branchId);

  return (
    <header className="sticky top-0 z-50 glass-panel border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-white p-0.5 shadow-sm border border-slate-100 shrink-0 overflow-hidden">
                <img src="/logos/logo1white.jfif" alt="Logo" className="h-full w-full object-cover" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1">
                <MapPin className="h-2 w-2" />
                {branch?.name || "Ama Bakery"}
              </p>
            </div>
            <h1 className="text-lg font-black text-foreground -mt-1 tracking-tight">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showNotification && (
            <Button variant="ghost" size="icon" className="relative h-10 w-10">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
                  {notificationCount}
                </span>
              )}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 bg-primary/10 text-primary hover:bg-primary/20 rounded-full transition-colors">
                <UserIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-xl border-none p-2 animate-in fade-in zoom-in-95 duration-200">
              <DropdownMenuLabel className="flex flex-col p-3">
                <span className="font-black text-xs uppercase tracking-widest text-muted-foreground">{user?.role || "Staff"} Account</span>
                <span className="text-sm font-bold text-foreground mt-1">{user?.name || "User"}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors active:scale-95">
                <Settings className="h-4 w-4 text-slate-500" />
                <span className="font-semibold">Preferences</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors active:scale-95">
                <HelpCircle className="h-4 w-4 text-slate-500" />
                <span className="font-semibold">Help Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer text-destructive focus:bg-destructive/5 focus:text-destructive active:scale-95 transition-all"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                <span className="font-bold">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
