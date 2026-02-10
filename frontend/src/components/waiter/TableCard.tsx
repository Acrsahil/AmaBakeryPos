import { Table } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { ChevronRight, Circle } from "lucide-react";

interface TableCardProps {
  table: Table;
  onClick: (table: Table) => void;
}

export function TableCard({ table, onClick }: TableCardProps) {
  const isOccupied = table.status !== 'available';

  return (
    <button
      onClick={() => onClick(table)}
      className={cn(
        "w-full flex items-center justify-between p-5 mb-3 rounded-2xl border-2 transition-all duration-300",
        "hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
        "bg-white border-primary/20 hover:border-primary shadow-sm"
      )}
    >
      <div className="flex items-center gap-5">
        <div className={cn(
          "h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner transition-colors",
          "bg-primary text-white"
        )}>
          {table.number}
        </div>

        <div className="flex flex-col items-start gap-1">
          <h3 className="text-lg font-bold text-slate-800">Table {table.number}</h3>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {table.groups && table.groups.length > 0 && (
          <div className="hidden sm:flex gap-2">
            {table.groups.map((group) => (
              <span
                key={group.id}
                className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase text-slate-500 shadow-sm"
              >
                {group.name}
              </span>
            ))}
          </div>
        )}
        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <ChevronRight className="h-6 w-6" />
        </div>
      </div>
    </button>
  );
}
