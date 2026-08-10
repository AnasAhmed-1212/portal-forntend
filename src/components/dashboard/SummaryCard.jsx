import React from "react";
import { Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const SummaryCard = ({ icon, text, number, bgColor }) => (
  <Card className="gap-0 py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
    <CardContent className="flex items-center gap-4 p-5">
      <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl shadow-sm ${bgColor}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">{text}</p>
        <p className="mt-1 truncate text-2xl font-semibold tracking-tight text-foreground">{number}</p>
      </div>
      <div className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:flex">
        <Activity className="size-3.5 text-emerald-600" />
        Live
      </div>
    </CardContent>
  </Card>
);

export default SummaryCard;
