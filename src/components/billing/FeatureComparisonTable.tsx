"use client";

import { Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FeatureRow {
  feature: string;
  free: boolean | string;
  pro: boolean | string;
}

const FEATURES: FeatureRow[] = [
  { feature: "Task management", free: true, pro: true },
  { feature: "Dashboard overview", free: true, pro: true },
  { feature: "Task limit", free: "20 tasks", pro: "Unlimited" },
  { feature: "Email support", free: true, pro: true },
  { feature: "Priority support", free: false, pro: true },
  { feature: "Advanced reporting", free: false, pro: "Coming soon" },
  { feature: "Team collaboration", free: false, pro: "Coming soon" },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return (
      <span className="font-body text-sm text-[#222222]">{value}</span>
    );
  }
  if (value) {
    return (
      <Check
        className="mx-auto size-5 text-[#B580FF]"
        aria-label="Included"
      />
    );
  }
  return (
    <X
      className="mx-auto size-5 text-[#6b6b6b]/40"
      aria-label="Not included"
    />
  );
}

export function FeatureComparisonTable() {
  return (
    <section className="mx-auto max-w-3xl">
      <h2 className="mb-6 text-center font-heading text-xl font-bold text-[#292673] sm:text-2xl">
        Compare plans
      </h2>
      <div className="overflow-x-auto rounded-lg border border-[#DAC0FF]/40 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="border-[#DAC0FF]/30">
              <TableHead className="w-1/2 font-body text-sm font-semibold text-[#292673]">
                Feature
              </TableHead>
              <TableHead className="text-center font-body text-sm font-semibold text-[#292673]">
                Free
              </TableHead>
              <TableHead className="text-center font-body text-sm font-semibold text-[#292673]">
                Pro
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FEATURES.map((row) => (
              <TableRow
                key={row.feature}
                className="border-[#DAC0FF]/20 hover:bg-[#F6F0FF]/50"
              >
                <TableCell className="font-body text-sm text-[#222222]">
                  {row.feature}
                </TableCell>
                <TableCell className="text-center">
                  <FeatureCell value={row.free} />
                </TableCell>
                <TableCell className="text-center">
                  <FeatureCell value={row.pro} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
