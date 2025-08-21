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

interface TimeEntry {
  id: string;
  employee_id: string;
  employee_name: string;
  check_in_time: string;
  check_out_time: string | null;
  total_hours: number | null;
  status: string;
  created_at: string;
}

interface ReportEntry {
  id: string;
  employee_id: string;
  employee_name: string;
  type: 'payout' | 'time_entry';
  calculation_type: string;
  amount: number;
  rate: number;
  project_value?: number | null;
  hours_worked?: number | null;
  collaborators_count?: number | null;
  project_title?: string | null;
  check_in_time?: string;
  check_out_time?: string | null;
  status?: string;
  created_at: string;
}

export function PayoutsReport({ refreshToken, isAdmin = true }: { refreshToken?: number | string; isAdmin?: boolean }) {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [employees, setEmployees] = useState<{id: string, name: string, hourly_rate: number | null}[]>([]);
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
    fetchTimeEntries();
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken, filterDateFrom, filterDateTo]);

  // Combine payouts and time entries into unified report data
  const reportEntries = useMemo(() => {
    const payoutEntries: ReportEntry[] = payouts.map(payout => ({
      ...payout,
      type: 'payout' as const,
    }));

    const timeEntryReports: ReportEntry[] = timeEntries
      .filter(entry => entry.status === 'checked_out' && entry.total_hours && entry.total_hours > 0)
      .map(entry => {
        const employee = employees.find(emp => emp.id === entry.employee_id);
        const hourlyRate = employee?.hourly_rate || 0;
        const amount = (entry.total_hours || 0) * hourlyRate;
        
        return {
          id: entry.id,
          employee_id: entry.employee_id,
          employee_name: entry.employee_name,
          type: 'time_entry' as const,
          calculation_type: 'hourly',
          amount,
          rate: hourlyRate,
          hours_worked: entry.total_hours,
          check_in_time: entry.check_in_time,
          check_out_time: entry.check_out_time,
          status: entry.status,
          created_at: entry.created_at,
        };
      });

    return [...payoutEntries, ...timeEntryReports];
  }, [payouts, timeEntries, employees]);

  // Apply client-side filters
  const filteredEntries = useMemo(() => {
    return reportEntries.filter(entry => {
      // Employee filter
      if (filterEmployee !== 'all' && entry.employee_id !== filterEmployee) {
        return false;
      }
      
      // Type filter
      if (filterType !== 'all' && entry.calculation_type !== filterType) {
        return false;
      }
      
      // Project title filter
      if (filterProjectTitle && !entry.project_title?.toLowerCase().includes(filterProjectTitle.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [reportEntries, filterEmployee, filterType, filterProjectTitle]);

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
        .select('id, name, hourly_rate')
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

  const fetchTimeEntries = async () => {
    try {
      let query = supabase
        .from('time_entries')
        .select('id, employee_id, employee_name, check_in_time, check_out_time, total_hours, status, created_at')
        .eq('status', 'checked_out')
        .not('total_hours', 'is', null);

      // Apply date filters
      if (filterDateFrom) {
        query = query.gte('created_at', filterDateFrom.toISOString());
      }
      if (filterDateTo) {
        const endOfDay = new Date(filterDateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setTimeEntries(data || []);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    }
  };

  const total = filteredEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);

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

  const convertTimeEntryToPayout = async (entry: ReportEntry) => {
    if (!entry.employee_id || !entry.amount || !entry.rate) return;
    
    try {
      const payoutData = {
        employee_id: entry.employee_id,
        employee_name: entry.employee_name,
        calculation_type: 'hourly',
        amount: entry.amount,
        rate: entry.rate,
        project_value: null,
        hours_worked: entry.hours_worked,
        collaborators_count: 1,
        project_title: null,
        assigned_member_id: null,
        assigned_member_name: null,
        quoted_by_id: null,
        quoted_by_name: null,
        is_first_time: false,
      };

      const { error } = await supabase.from('payouts').insert([payoutData]);
      if (error) throw error;
      
      toast({ 
        title: 'Converted', 
        description: 'Time entry converted to editable payout record' 
      });
      fetchPayouts();
    } catch (err) {
      console.error('Failed to convert time entry', err);
      toast({ 
        title: 'Error', 
        description: 'Failed to convert time entry', 
        variant: 'destructive' 
      });
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
          {loading ? 'Loading…' : `${filteredEntries.length} of ${reportEntries.length} entries • Total $${total.toFixed(2)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filter Controls */}
        <Card className="border-muted/40 bg-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <Label className="text-base font-semibold">Filter Reports</Label>
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Clear All
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Employee Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Employee</Label>
                <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                  <SelectTrigger className="h-10">
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
                <Label className="text-sm font-medium">Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-10">
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
                <Label className="text-sm font-medium">Project Title</Label>
                <Input
                  placeholder="Search project..."
                  value={filterProjectTitle}
                  onChange={(e) => setFilterProjectTitle(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Date From Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-10 justify-start text-left font-normal",
                        !filterDateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterDateFrom ? format(filterDateFrom, "MMM dd, yyyy") : <span>Pick date</span>}
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
                <Label className="text-sm font-medium">To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-10 justify-start text-left font-normal",
                        !filterDateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterDateTo ? format(filterDateTo, "MMM dd, yyyy") : <span>Pick date</span>}
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
          </CardContent>
        </Card>

        {/* Table */}
        {filteredEntries.length === 0 && !loading ? (
          <div className="text-center py-10 text-muted-foreground">
            {reportEntries.length === 0 ? "No records found yet." : "No records match your filters."}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Project/Time Period</TableHead>
                  <TableHead className="text-right">Amount ($)</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={`${entry.type}-${entry.id}`}>
                    <TableCell className="font-medium">{entry.employee_name}</TableCell>
                    <TableCell>
                      <Badge variant={entry.type === 'payout' ? 'default' : 'outline'}>
                        {entry.type === 'payout' ? 'Manual' : 'Time Clock'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entry.calculation_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {entry.type === 'payout' ? (
                        entry.project_title || '-'
                      ) : (
                        entry.check_in_time && entry.check_out_time ? (
                          <span className="text-sm">
                            {new Date(entry.check_in_time).toLocaleTimeString()} - {new Date(entry.check_out_time).toLocaleTimeString()}
                          </span>
                        ) : '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">{Number(entry.amount ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {Number(entry.rate ?? 0)}{entry.calculation_type === 'project' ? '%' : '/hr'}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.calculation_type === 'project' ? (
                        entry.project_value ? `$${Number(entry.project_value).toFixed(2)}` : '-'
                      ) : (
                        entry.hours_worked ? `${Number(entry.hours_worked).toFixed(2)}h` : '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">{new Date(entry.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {entry.type === 'payout' && isAdmin && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => setEditing(entry as Payout)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deletePayout(entry.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                        {entry.type === 'time_entry' && isAdmin && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => convertTimeEntryToPayout(entry)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {entry.type === 'time_entry' && !isAdmin && (
                          <Badge variant="outline" className="text-xs">
                            Auto-calculated
                          </Badge>
                        )}
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
