'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ActivityLogProps {
  logs: string[];
}

export function ActivityLog({ logs }: ActivityLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Activity Log</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] w-full rounded-lg border bg-muted/30">
          <div ref={scrollRef} className="p-4 space-y-2">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="text-xs font-mono text-foreground/80 leading-relaxed animate-fade-in"
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
