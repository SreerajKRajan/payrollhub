import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, Calendar, Edit3, Trash2, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { format, differenceInHours, differenceInMinutes, startOfDay, addMinutes } from "date-fns";
import { EditTimeEntryDialog } from "./EditTimeEntryDialog";

interface Employee {
  id: string;
  name: string;
  pay_scale_type: "hourly" | "project";
  status: "active" | "inactive" | "on_leave";
}

interface TimeEntry {
  id: string;
  employee_id: string;
  employee_name: string;
  check_in_time: string;
  check_out_time?: string;
  total_hours?: number;
  status: string;
  notes?: string;
  created_at: string;
  timezone_offset?: number;
}

interface TimeTrackingProps {
  preSelectedEmployee?: { id: string; name: string } | null;
  isAdmin?: boolean;
  currentUser?: { id: string; name: string; email: string } | null;
}

export function TimeTracking({ preSelectedEmployee, isAdmin = true, currentUser }: TimeTrackingProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [userTimezoneOffset] = useState(() => new Date().getTimezoneOffset());
  const { toast } = useToast();

  // Helper: Get start of day in user's local timezone
  const getLocalStartOfDay = () => {
    const now = new Date();
    const localStart = startOfDay(now);
    return localStart.toISOString();
  };

  // Helper: Convert UTC time to user's local time for display
  const toLocalTime = (utcTime: string, timezoneOffset?: number) => {
    const date = new Date(utcTime);
    // If timezone_offset is stored, use it; otherwise use current offset
    const offset = timezoneOffset !== undefined ? timezoneOffset : userTimezoneOffset;
    // offset is negative for timezones ahead of UTC (e.g., -330 for UTC+5:30)
    // To convert UTC to local, we subtract the offset (which adds the hours)
    // But we need to return a date that format() will interpret correctly
    // So we subtract the user's current timezone offset to compensate for format()'s auto-conversion
    const localDate = addMinutes(date, -offset);
    // Compensate for format()'s timezone application by adjusting back
    const currentBrowserOffset = new Date().getTimezoneOffset();
    return addMinutes(localDate, currentBrowserOffset);
  };

  // Helper: Get timezone display string
  const getTimezoneDisplay = () => {
    const offsetHours = Math.abs(userTimezoneOffset) / 60;
    const sign = userTimezoneOffset <= 0 ? '+' : '-';
    return `UTC${sign}${offsetHours.toFixed(1)}`;
  };

  useEffect(() => {
    fetchEmployees();
    fetchTimeEntries();
  }, []);

  useEffect(() => {
    if (preSelectedEmployee) {
      setSelectedEmployee(preSelectedEmployee.id);
    }
  }, [preSelectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, pay_scale_type, status')
        .eq('status', 'active')
        .eq('pay_scale_type', 'hourly')
        .order('name');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      });
    }
  };

  const fetchTimeEntries = async () => {
    try {
      // Get start of day in user's local timezone
      const localStartOfDay = getLocalStartOfDay();
      
      console.log('🕐 Timezone Debug:', {
        userOffset: userTimezoneOffset,
        timezone: getTimezoneDisplay(),
        localStartOfDay,
        now: new Date().toISOString()
      });
      
      let query = supabase
        .from('time_entries')
        .select('*')
        .gte('check_in_time', localStartOfDay);

      // Filter by current user if not admin
      if (!isAdmin && currentUser) {
        query = query.eq('employee_id', currentUser.id);
      }

      const { data, error } = await query.order('check_in_time', { ascending: false });
      
      if (error) throw error;
      
      console.log(`✅ Fetched ${data?.length || 0} time entries for today (${getTimezoneDisplay()})`);
      
      setTimeEntries(data || []);
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast({
        title: "Error",
        description: "Failed to load time entries",
        variant: "destructive",
      });
    }
  };

  const handleCheckIn = async () => {
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Please select an employee",
        variant: "destructive",
      });
      return;
    }

    const employee = employees.find(emp => emp.id === selectedEmployee);
    if (!employee) return;

    // Check if employee is already checked in
    const existingEntry = timeEntries.find(
      entry => entry.employee_id === selectedEmployee && entry.status === 'checked_in'
    );

    if (existingEntry) {
      toast({
        title: "Already Checked In",
        description: `${employee.name} is already checked in`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const checkInTime = new Date();
      
      console.log('🔵 Check-in:', {
        employee: employee.name,
        time: checkInTime.toISOString(),
        timezone: getTimezoneDisplay(),
        offset: userTimezoneOffset
      });

      const { data, error } = await supabase
        .from('time_entries')
        .insert([{
          employee_id: selectedEmployee,
          employee_name: employee.name,
          check_in_time: checkInTime.toISOString(),
          notes: notes || null,
          status: 'checked_in',
          timezone_offset: userTimezoneOffset
        }])
        .select()
        .single();

      if (error) throw error;

      setTimeEntries(prev => [data, ...prev]);
      setNotes("");
      setSelectedEmployee("");
      
      toast({
        title: "Success",
        description: `${employee.name} checked in successfully at ${format(checkInTime, 'HH:mm')} (${getTimezoneDisplay()})`,
      });
    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: "Error",
        description: "Failed to check in",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async (entryId: string) => {
    const entry = timeEntries.find(e => e.id === entryId);
    if (!entry) return;

    setIsLoading(true);
    try {
      const checkOutTime = new Date();
      
      console.log('🔴 Check-out:', {
        employee: entry.employee_name,
        checkInTime: entry.check_in_time,
        checkOutTime: checkOutTime.toISOString(),
        timezone: getTimezoneDisplay()
      });

      const { data, error } = await supabase
        .from('time_entries')
        .update({
          check_out_time: checkOutTime.toISOString(),
          status: 'checked_out'
        })
        .eq('id', entryId)
        .select()
        .single();

      if (error) throw error;

      setTimeEntries(prev => 
        prev.map(entry => entry.id === entryId ? data : entry)
      );

      toast({
        title: "Success",
        description: `${entry.employee_name} checked out successfully at ${format(checkOutTime, 'HH:mm')} (${getTimezoneDisplay()})`,
      });
    } catch (error) {
      console.error('Error checking out:', error);
      toast({
        title: "Error",
        description: "Failed to check out",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getWorkingTime = (checkInTime: string, checkOutTime?: string) => {
    const startTime = new Date(checkInTime);
    const endTime = checkOutTime ? new Date(checkOutTime) : new Date();
    
    const totalMinutes = differenceInMinutes(endTime, startTime);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const checkedInEmployees = timeEntries.filter(entry => entry.status === 'checked_in');
  
  // Filter entries based on local timezone date
  const todayEntries = timeEntries.filter(entry => {
    const localCheckInTime = toLocalTime(entry.check_in_time, entry.timezone_offset);
    const localToday = new Date();
    return localCheckInTime.toDateString() === localToday.toDateString();
  });

  return (
    <div className="space-y-6">
      {/* Timezone Indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
        <Globe className="h-4 w-4" />
        <span>Your timezone: {getTimezoneDisplay()}</span>
        <span className="text-xs">({Intl.DateTimeFormat().resolvedOptions().timeZone})</span>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Currently Working</p>
                <p className="text-2xl font-bold">{checkedInEmployees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Today's Entries</p>
                <p className="text-2xl font-bold">{todayEntries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold">
                  {todayEntries.filter(e => e.status === 'checked_out').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Check-in Form */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Employee Check-in
          </CardTitle>
          <CardDescription>
            Select an employee to check them in for their shift
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Textarea
                placeholder="Add notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[40px] max-h-[80px]"
              />
            </div>
            <Button 
              onClick={handleCheckIn}
              disabled={isLoading || !selectedEmployee}
              className="whitespace-nowrap"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Check In
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      {checkedInEmployees.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Active Sessions
            </CardTitle>
            <CardDescription>
              Employees currently checked in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checkedInEmployees.map((entry) => (
                <div 
                  key={entry.id} 
                  className="flex items-center justify-between p-4 border rounded-lg bg-primary/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                    <div>
                      <p className="font-medium">{entry.employee_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Started: {format(toLocalTime(entry.check_in_time, entry.timezone_offset), 'HH:mm')}
                        {entry.notes && ` • ${entry.notes}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-primary border-primary">
                      {getWorkingTime(entry.check_in_time)}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCheckOut(entry.id)}
                      disabled={isLoading}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Check Out
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's History */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Time Entries
          </CardTitle>
          <CardDescription>
            All check-ins and check-outs for today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No time entries for today yet
            </p>
          ) : (
            <div className="space-y-3">
              {todayEntries.map((entry) => (
                <div 
                  key={entry.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{entry.employee_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(toLocalTime(entry.check_in_time, entry.timezone_offset), 'HH:mm')}
                      {entry.check_out_time && (
                        <> - {format(toLocalTime(entry.check_out_time, entry.timezone_offset), 'HH:mm')}</>
                      )}
                      {entry.notes && ` • ${entry.notes}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={entry.status === 'checked_in' ? 'default' : 'secondary'}
                    >
                      {entry.status === 'checked_in' ? 'Active' : 'Completed'}
                    </Badge>
                    {entry.total_hours && (
                      <Badge variant="outline">
                        {entry.total_hours.toFixed(2)}h
                      </Badge>
                    )}
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingEntry(entry)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Time Entry Dialog */}
      {editingEntry && (
        <EditTimeEntryDialog
          entry={editingEntry}
          open={!!editingEntry}
          onOpenChange={(open) => !open && setEditingEntry(null)}
          onSaved={() => {
            fetchTimeEntries();
            setEditingEntry(null);
          }}
        />
      )}
    </div>
  );
}