import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil, TrendingUp, Trash2, Filter, CalendarIcon, X } from "lucide-react";
import { EditPayoutDialog } from "./EditPayoutDialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  project_title: string | null;
  created_at: string;
}

export function PayoutsReport({ refreshToken }: { refreshToken?: number | string }) {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [employees, setEmployees] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Payout | null>(null);
  
  // Filter states
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterProjectTitle, setFilterProjectTitle] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>(undefined);
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>(undefined);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchPayouts();
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken, filterDateFrom, filterDateTo]);

  // Apply client-side filters
  const filteredPayouts = useMemo(() => {
    return payouts.filter(payout => {
      // Employee filter
      if (filterEmployee !== 'all' && payout.employee_id !== filterEmployee) {
        return false;
      }
      
      // Type filter
      if (filterType !== 'all' && payout.calculation_type !== filterType) {
        return false;
      }
      
      // Project title filter
      if (filterProjectTitle && !payout.project_title?.toLowerCase().includes(filterProjectTitle.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [payouts, filterEmployee, filterType, filterProjectTitle]);

  const clearFilters = () => {
    setFilterEmployee('all');
    setFilterType('all');
    setFilterProjectTitle('');
    setFilterDateFrom(undefined);
    setFilterDateTo(undefined);
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('payouts')
        .select('id, employee_id, employee_name, calculation_type, amount, rate, project_value, hours_worked, collaborators_count, project_title, created_at');

      // Apply date filters
      if (filterDateFrom) {
        query = query.gte('created_at', filterDateFrom.toISOString());
      }
      if (filterDateTo) {
        const endOfDay = new Date(filterDateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
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

  const total = filteredPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);

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
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          Payroll Reports
        </CardTitle>
        <CardDescription>
          {loading ? 'Loading…' : `${filteredPayouts.length} of ${payouts.length} payouts • Total $${total.toFixed(2)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filter Controls */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4" />
            <Label className="font-semibold">Filters</Label>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Employee Filter */}
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All employees</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Project Title Filter */}
            <div className="space-y-2">
              <Label>Project Title</Label>
              <Input
                placeholder="Search project..."
                value={filterProjectTitle}
                onChange={(e) => setFilterProjectTitle(e.target.value)}
              />
            </div>

            {/* Date From Filter */}
            <div className="space-y-2">
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !filterDateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterDateFrom ? format(filterDateFrom, "PPP") : <span>Pick date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filterDateFrom}
                    onSelect={setFilterDateFrom}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To Filter */}
            <div className="space-y-2">
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !filterDateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterDateTo ? format(filterDateTo, "PPP") : <span>Pick date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filterDateTo}
                    onSelect={setFilterDateTo}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </Card>

        {/* Table */}
        {filteredPayouts.length === 0 && !loading ? (
          <div className="text-center py-10 text-muted-foreground">
            {payouts.length === 0 ? "No payouts recorded yet." : "No payouts match your filters."}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Project Title</TableHead>
                  <TableHead className="text-right">Amount ($)</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Project/Hours</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayouts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.employee_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{p.calculation_type}</Badge>
                    </TableCell>
                    <TableCell>{p.project_title || '-'}</TableCell>
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
