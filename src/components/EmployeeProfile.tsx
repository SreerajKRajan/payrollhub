import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { XCircle, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EditPayoutDialog } from "./EditPayoutDialog";

interface EmployeeProfileProps {
  employee: Employee;
  onClose: () => void;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  status: 'active' | 'inactive' | 'on_leave';
  pay_scale_type: 'hourly' | 'project';
  hourly_rate?: number | null;
  project_rate_1_member?: number | null;
  project_rate_2_members?: number | null;
  project_rate_3_members?: number | null;
  project_rate_4_members?: number | null;
  project_rate_5_members?: number | null;
}

interface PayoutRow {
  id: string;
  calculation_type: string;
  amount: number;
  rate: number;
  project_value: number | null;
  hours_worked: number | null;
  collaborators_count: number | null;
  created_at: string;
}

export function EmployeeProfile({ employee, onClose }: EmployeeProfileProps) {
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PayoutRow | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee.id]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payouts')
        .select('id, calculation_type, amount, rate, project_value, hours_worked, collaborators_count, created_at')
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayouts(data || []);
    } catch (err) {
      console.error('Failed to load payouts', err);
      toast({ title: 'Error', description: 'Failed to load payout history', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const total = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);

  const deletePayout = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payout?')) return;
    
    try {
      const { error } = await supabase.from('payouts').delete().eq('id', id);
      if (error) throw error;
      
      toast({ title: 'Deleted', description: 'Payout deleted successfully' });
      fetchPayouts();
    } catch (err) {
      console.error('Failed to delete payout', err);
      toast({ title: 'Error', description: 'Failed to delete payout', variant: 'destructive' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{employee.name}</CardTitle>
            <CardDescription>
              {employee.department} • {employee.position}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close profile">
            <XCircle className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Pay Type</div>
              <div className="font-medium capitalize">{employee.pay_scale_type}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge className="mt-1">{employee.status.replace('_', ' ')}</Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Payouts Recorded</div>
              <div className="font-medium">${total.toFixed(2)}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Payout History</h3>
              <div className="text-sm text-muted-foreground">{payouts.length} record{payouts.length === 1 ? '' : 's'}</div>
            </div>
            {payouts.length === 0 && !loading ? (
              <div className="text-center py-8 text-muted-foreground">No payouts recorded yet.</div>
            ) : (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Project/Hours</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell><Badge variant="secondary">{p.calculation_type}</Badge></TableCell>
                        <TableCell className="text-right">${Number(p.amount ?? 0).toFixed(2)}</TableCell>
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
                          <div className="flex items-center gap-1 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => setEditing(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deletePayout(p.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {editing && (
            <EditPayoutDialog
              payout={{
                id: editing.id,
                employee_id: employee.id,
                employee_name: employee.name,
                calculation_type: editing.calculation_type,
                amount: editing.amount,
                rate: editing.rate,
                project_value: editing.project_value,
                hours_worked: editing.hours_worked,
                collaborators_count: editing.collaborators_count,
              }}
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
    </div>
  );
}
