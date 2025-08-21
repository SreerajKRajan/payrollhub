import { useState, useEffect } from "react";
import { Calculator, DollarSign, Users, Clock, Percent } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  name: string;
  pay_scale_type: 'hourly' | 'project';
  hourly_rate?: number;
  project_rate_1_member?: number;
  project_rate_2_members?: number;
  project_rate_3_members?: number;
  project_rate_4_members?: number;
  project_rate_5_members?: number;
}

interface TimeEntry {
  id: string;
  employee_id: string;
  employee_name: string;
  check_in_time: string;
  check_out_time?: string;
  total_hours?: number;
  status: string;
  created_at: string;
}

interface PayoutResult {
  employeeId: string;
  employeeName: string;
  amount: number;
  rate: number;
  payType: 'hourly' | 'project';
}

export function PayrollCalculator({ onRecorded, isAdmin = true }: { onRecorded?: () => void; isAdmin?: boolean }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [calculationType, setCalculationType] = useState<'hourly' | 'project'>('project');
  const [projectValue, setProjectValue] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [quotedById, setQuotedById] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [payoutResults, setPayoutResults] = useState<PayoutResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [useTrackedHours, setUseTrackedHours] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [selectedTimeEntries, setSelectedTimeEntries] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (calculationType === 'hourly' && useTrackedHours) {
      fetchTimeEntries();
    }
  }, [calculationType, useTrackedHours, selectedEmployees]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, pay_scale_type, hourly_rate, project_rate_1_member, project_rate_2_members, project_rate_3_members, project_rate_4_members, project_rate_5_members')
        .eq('status', 'active');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeEntries = async () => {
    if (selectedEmployees.length === 0) return;
    
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .in('employee_id', selectedEmployees)
        .eq('status', 'checked_out')
        .not('total_hours', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setTimeEntries(data || []);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    }
  };

  const calculateHours = () => {
    if (useTrackedHours) {
      // Sum up selected time entries
      return selectedTimeEntries.reduce((total, entryId) => {
        const entry = timeEntries.find(e => e.id === entryId);
        return total + (entry?.total_hours || 0);
      }, 0);
    } else {
      // Manual time calculation
      if (!startTime || !endTime) return 0;
      
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      let totalMinutes = endMinutes - startMinutes;
      if (totalMinutes < 0) {
        // Handle overnight work (end time is next day)
        totalMinutes = (24 * 60) - startMinutes + endMinutes;
      }
      
      return totalMinutes / 60;
    }
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const calculatePayouts = async () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one employee",
        variant: "destructive",
      });
      return;
    }

    const results: PayoutResult[] = [];
    const collaborationCount = selectedEmployees.length;

    selectedEmployees.forEach(employeeId => {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) return;

      let amount = 0;
      let rate = 0;

      if (calculationType === 'hourly' && employee.pay_scale_type === 'hourly') {
        rate = employee.hourly_rate || 0;
        amount = rate * calculateHours();
      } else if (calculationType === 'project' && employee.pay_scale_type === 'project') {
        const projectVal = parseFloat(projectValue) || 0;
        
        // Get the appropriate rate based on collaboration count
        switch (collaborationCount) {
          case 1:
            rate = employee.project_rate_1_member || 0;
            break;
          case 2:
            rate = employee.project_rate_2_members || 0;
            break;
          case 3:
            rate = employee.project_rate_3_members || 0;
            break;
          case 4:
            rate = employee.project_rate_4_members || 0;
            break;
          case 5:
            rate = employee.project_rate_5_members || 0;
            break;
          default:
            // For more than 5 members, use the 5-member rate
            rate = employee.project_rate_5_members || 0;
        }
        
        amount = (projectVal * rate) / 100;
      }

      results.push({
        employeeId: employee.id,
        employeeName: employee.name,
        amount,
        rate,
        payType: employee.pay_scale_type,
      });
    });

    // Add first-time bonus for quoted by person
    if (isFirstTime && quotedById && calculationType === 'project') {
      const quotedByEmployee = employees.find(emp => emp.id === quotedById);
      if (quotedByEmployee) {
        const projectVal = parseFloat(projectValue) || 0;
        const bonusAmount = (projectVal * 30) / 100; // 30% bonus
        
        results.push({
          employeeId: quotedByEmployee.id,
          employeeName: `${quotedByEmployee.name} (First Time Bonus)`,
          amount: bonusAmount,
          rate: 30, // 30% rate
          payType: 'project',
        });
      }
    }

    setPayoutResults(results);
    
    // Save payouts to database
    try {
      const quotedBy = employees.find(emp => emp.id === quotedById);
      
      const payoutRecords = results.map(result => ({
        employee_id: result.employeeId,
        employee_name: result.employeeName,
        calculation_type: calculationType,
        amount: result.amount,
        rate: result.rate,
        project_value: calculationType === 'project' ? parseFloat(projectValue) || null : null,
        hours_worked: calculationType === 'hourly' ? calculateHours() || null : null,
        collaborators_count: collaborationCount,
        project_title: projectTitle || null,
        assigned_member_id: null,
        assigned_member_name: null,
        quoted_by_id: quotedById || null,
        quoted_by_name: quotedBy?.name || null,
        is_first_time: isFirstTime,
        source: 'manual',
      }));

      const { error } = await supabase
        .from('payouts')
        .insert(payoutRecords);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payouts calculated and recorded successfully",
        variant: "default",
      });
      onRecorded?.();
    } catch (error) {
      console.error('Error saving payouts:', error);
      toast({
        title: "Warning", 
        description: "Payouts calculated but failed to save records",
        variant: "destructive",
      });
    }
  };

  const getTotalPayout = () => {
    return payoutResults.reduce((total, result) => total + result.amount, 0);
  };

  const getEligibleEmployees = () => {
    return employees.filter(emp => emp.pay_scale_type === calculationType);
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Payroll Calculator
          </CardTitle>
          <CardDescription>
            Calculate payouts for projects or hourly work
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calculation Type */}
          <div className="space-y-2">
            <Label>Calculation Type</Label>
            <Select value={calculationType} onValueChange={(value: any) => {
              setCalculationType(value);
              setSelectedEmployees([]);
              setPayoutResults([]);
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Project-based</SelectItem>
                <SelectItem value="hourly">Hourly-based</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Project Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-title">Project Title</Label>
              <Input
                id="project-title"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Enter project title"
              />
            </div>
            
            {calculationType === 'project' && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="first-time"
                  checked={isFirstTime}
                  onCheckedChange={(checked) => setIsFirstTime(checked === true)}
                />
                <Label htmlFor="first-time" className="text-sm font-medium">
                  First time project
                </Label>
              </div>
            )}
          </div>

          {/* Team Assignment - Only for project-based */}
          {calculationType === 'project' && (
            <div className="space-y-2">
              <Label>Quoted By</Label>
              <Select value={quotedById} onValueChange={setQuotedById}>
                <SelectTrigger>
                  <SelectValue placeholder="Select who quoted" />
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
          )}

          {/* Input Fields */}
          {calculationType === 'project' ? (
            <div className="space-y-2">
              <Label htmlFor="project-value">Project Value ($)</Label>
              <Input
                id="project-value"
                type="number"
                step="0.01"
                value={projectValue}
                onChange={(e) => setProjectValue(e.target.value)}
                placeholder="1000.00"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Time Entry Method Toggle */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="use-tracked"
                    checked={useTrackedHours}
                    onCheckedChange={(checked) => setUseTrackedHours(checked === true)}
                  />
                  <Label htmlFor="use-tracked" className="text-sm font-medium">
                    Use tracked hours from time clock
                  </Label>
                </div>
              </div>

              {useTrackedHours ? (
                <div className="space-y-4">
                  <Label>Select Time Entries</Label>
                  {timeEntries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2" />
                      <p>No completed time entries found for selected employees</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {timeEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedTimeEntries.includes(entry.id)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-accent'
                          }`}
                          onClick={() => {
                            setSelectedTimeEntries(prev =>
                              prev.includes(entry.id)
                                ? prev.filter(id => id !== entry.id)
                                : [...prev, entry.id]
                            );
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{entry.employee_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(entry.check_in_time).toLocaleDateString()} • {entry.total_hours?.toFixed(2)}h
                              </p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              selectedTimeEntries.includes(entry.id)
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground'
                            }`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedTimeEntries.length > 0 && (
                    <Badge variant="outline" className="text-sm">
                      Total Hours: {calculateHours().toFixed(2)} hrs
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                  {startTime && endTime && (
                    <div className="col-span-1 md:col-span-2">
                      <Badge variant="outline" className="text-sm">
                        Total Hours: {calculateHours().toFixed(2)} hrs
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Employee Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Select Employees</Label>
              <Badge variant="secondary">
                {selectedEmployees.length} selected
              </Badge>
            </div>
            
            {getEligibleEmployees().length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No employees available for {calculationType} calculations
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add employees with {calculationType} pay scale to use this calculator
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {getEligibleEmployees().map((employee) => (
                  <div
                    key={employee.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedEmployees.includes(employee.id)
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-accent'
                    }`}
                    onClick={() => toggleEmployeeSelection(employee.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{employee.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {employee.pay_scale_type === 'hourly' ? (
                            <>
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                ${employee.hourly_rate || 0}/hr
                              </span>
                            </>
                          ) : (
                            <>
                              <Percent className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {employee.project_rate_1_member || 0}% (solo)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedEmployees.includes(employee.id)
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Calculate Button */}
          {isAdmin && (
            <Button 
              onClick={calculatePayouts} 
              variant="gradient" 
              size="lg" 
              className="w-full"
              disabled={selectedEmployees.length === 0 || (calculationType === 'project' ? !projectValue : useTrackedHours ? selectedTimeEntries.length === 0 : (!startTime || !endTime))}
            >
              <Calculator className="h-5 w-5 mr-2" />
              Calculate Payouts
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {payoutResults.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success" />
                Payout Results
              </span>
              <Badge variant="default" className="text-lg px-3 py-1">
                Total: ${getTotalPayout().toFixed(2)}
              </Badge>
            </CardTitle>
            <CardDescription>
              {calculationType === 'project' 
                ? `Project value: $${projectValue} • ${selectedEmployees.length} collaborator(s)`
                : `${calculateHours().toFixed(2)} hours worked (${startTime} - ${endTime})`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payoutResults.map((result) => (
                <div
                  key={result.employeeId}
                  className="flex items-center justify-between p-4 bg-gradient-card rounded-lg border"
                >
                  <div>
                    <h4 className="font-medium">{result.employeeName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {result.payType === 'hourly' 
                        ? `$${result.rate}/hr × ${calculateHours().toFixed(2)} hours`
                        : `${result.rate}% of $${projectValue}`
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-success">
                      ${result.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}