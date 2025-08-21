import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil, TrendingUp } from "lucide-react";
import { EditPayoutDialog } from "./EditPayoutDialog";

interface Payout {
  id: string;
  employee_id: string;
  employee_name: string;
  calculation_type: string;
  amount: number;
  rate: number;
  project_value: number | null;
  hours_worked: number | null;
  collaborators_count: number | null;
  created_at: string;
}

export function PayoutsReport({ refreshToken }: { refreshToken?: number | string }) {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Payout | null>(null);
  const { toast } = useToast();

  const startOfMonthIso = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  useEffect(() => {
    fetchPayouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startOfMonthIso, refreshToken]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payouts')
        .select('id, employee_id, employee_name, calculation_type, amount, rate, project_value, hours_worked, collaborators_count, created_at')
        .gte('created_at', startOfMonthIso)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayouts(data || []);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payroll reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const total = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          Payroll Reports (This Month)
        </CardTitle>
        <CardDescription>
          {loading ? 'Loading…' : `${payouts.length} payout${payouts.length === 1 ? '' : 's'} • Total $${total.toFixed(2)}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payouts.length === 0 && !loading ? (
          <div className="text-center py-10 text-muted-foreground">No payouts recorded this month yet.</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount ($)</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Project/Hours</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.employee_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{p.calculation_type}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{Number(p.amount ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{Number(p.rate ?? 0)}{p.calculation_type === 'project' ? '%' : '/hr'}</TableCell>
                    <TableCell className="text-right">
                      {p.calculation_type === 'project' ? (
                        p.project_value ? `$${Number(p.project_value).toFixed(2)}` : '-'
                      ) : (
                        p.hours_worked ? `${Number(p.hours_worked)}` : '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">{new Date(p.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {editing && (
          <EditPayoutDialog
            payout={editing}
            open={!!editing}
            onOpenChange={(open) => !open && setEditing(null)}
            onSaved={() => {
              setEditing(null);
              fetchPayouts();
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
