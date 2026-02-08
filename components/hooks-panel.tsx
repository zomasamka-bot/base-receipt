'use client';

import React from "react"

import { Shield, CheckCircle2, BarChart3 } from 'lucide-react';

interface HookItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: 'active' | 'inactive';
}

const HOOKS: HookItem[] = [
  {
    icon: <Shield className="w-4 h-4" />,
    label: 'Limits',
    value: 'Within bounds',
    status: 'active',
  },
  {
    icon: <CheckCircle2 className="w-4 h-4" />,
    label: 'Approvals',
    value: 'Required',
    status: 'active',
  },
  {
    icon: <BarChart3 className="w-4 h-4" />,
    label: 'Reporting',
    value: 'Enabled',
    status: 'active',
  },
];

export function HooksPanel() {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <h3 className="font-semibold mb-3 text-sm">System Hooks</h3>
      <div className="space-y-2">
        {HOOKS.map((hook) => (
          <div
            key={hook.label}
            className="flex items-center justify-between p-2 rounded bg-muted/30"
          >
            <div className="flex items-center gap-2">
              <div className="text-primary">{hook.icon}</div>
              <span className="text-sm font-medium">{hook.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{hook.value}</span>
              <div
                className={`w-2 h-2 rounded-full ${
                  hook.status === 'active' ? 'bg-success' : 'bg-muted'
                }`}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
        Oversight and verification layer. No direct financial execution.
      </p>
    </div>
  );
}
