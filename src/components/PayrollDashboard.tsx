import { useState, useEffect } from "react";
import { Calculator, DollarSign, TrendingUp, Clock, Settings as SettingsIcon, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PayrollCalculator } from "./PayrollCalculator";
import { TimeTracking } from "./TimeTracking";
import { Settings } from "./Settings";
import { supabase } from "@/integrations/supabase/client";
import { PayoutsReport } from "./PayoutsReport";

export function PayrollDashboard() {
  const [activeTab, setActiveTab] = useState("calculator");
  const [stats, setStats] = useState({
    totalEmployees: 0,
    avgHourlyRate: 0,
    monthlyHourlyPayouts: 0,
    monthlyProjectPayouts: 0,
  });
  const [selectedEmployee, setSelectedEmployee] = useState<{id: string; name: string} | null>(null);
  const [showTimeClockTab, setShowTimeClockTab] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<{id: string; name: string; email: string} | null>(null);

  useEffect(() => {
    fetchStats();
    checkEmailParameter();
  }, []);

  const checkEmailParameter = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    
    if (email) {
      try {
        const { data: employee, error } = await supabase
          .from('employees')
          .select('id, name, email, pay_scale_type, status, is_admin')
          .eq('email', email)
          .eq('status', 'active')
          .single();

        if (error) {
          console.log('Employee not found or error:', error);
          setShowTimeClockTab(false);
          setIsAdmin(false);
          setCurrentUser(null);
          return;
        }

        if (employee) {
          setCurrentUser({ id: employee.id, name: employee.name, email: employee.email });
          const isEmployeeAdmin = employee.is_admin || false;
          setIsAdmin(isEmployeeAdmin);
          
          // Show time clock for hourly employees or admins
          if (employee.pay_scale_type === 'hourly' || isEmployeeAdmin) {
            setSelectedEmployee({ id: employee.id, name: employee.name });
            setShowTimeClockTab(true);
            if (employee.pay_scale_type === 'hourly') {
              setActiveTab("timetracking");
            }
          } else {
            setShowTimeClockTab(false);
          }
        } else {
          setShowTimeClockTab(false);
          setIsAdmin(false);
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Error fetching employee by email:', error);
        setShowTimeClockTab(false);
        setIsAdmin(false);
        setCurrentUser(null);
      }
    } else {
      // No email parameter, show time clock tab and assume admin access
      setShowTimeClockTab(true);
      setIsAdmin(true);
      setCurrentUser(null);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch employee count
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch average hourly rate
      const { data: hourlyEmployees } = await supabase
        .from('employees')
        .select('hourly_rate')
        .eq('status', 'active')
        .eq('pay_scale_type', 'hourly')
        .not('hourly_rate', 'is', null);

      const avgHourlyRate = hourlyEmployees && hourlyEmployees.length > 0
        ? hourlyEmployees.reduce((sum, emp) => sum + (emp.hourly_rate || 0), 0) / hourlyEmployees.length
        : 0;

      // Fetch this month's payouts separated by type
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyPayouts } = await supabase
        .from('payouts')
        .select('amount, calculation_type')
        .gte('created_at', startOfMonth.toISOString());

      const monthlyHourlyPayouts = monthlyPayouts
        ? monthlyPayouts.filter(p => p.calculation_type === 'hourly').reduce((sum, payout) => sum + (payout.amount || 0), 0)
        : 0;

      const monthlyProjectPayouts = monthlyPayouts
        ? monthlyPayouts.filter(p => p.calculation_type === 'project').reduce((sum, payout) => sum + (payout.amount || 0), 0)
        : 0;

      setStats({
        totalEmployees: employeeCount || 0,
        avgHourlyRate,
        monthlyHourlyPayouts,
        monthlyProjectPayouts,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const statsData = [
    {
      title: "Total Employees",
      value: stats.totalEmployees.toString(),
      description: "Active team members",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Hourly Payouts",
      value: `$${stats.monthlyHourlyPayouts.toFixed(0)}`,
      description: "This month",
      icon: Clock,
      color: "text-success",
    },
    {
      title: "Project Payouts",
      value: `$${stats.monthlyProjectPayouts.toFixed(0)}`,
      description: "This month",
      icon: TrendingUp,
      color: "text-accent",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              CrewClock
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your team's payroll with precision and style
            </p>
          </div>
        </div>

        {/* Stats Cards - Only show for admins */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statsData.map((stat, index) => (
              <Card key={index} className="shadow-card hover:shadow-hover transition-smooth">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${showTimeClockTab ? 'grid-cols-4 lg:w-[500px]' : 'grid-cols-3 lg:w-[400px]'}`}>
            {showTimeClockTab && (
              <TabsTrigger value="timetracking" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Clock
              </TabsTrigger>
            )}
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {showTimeClockTab && (
          <TabsContent value="timetracking" className="space-y-6">
            <TimeTracking preSelectedEmployee={selectedEmployee} isAdmin={isAdmin} currentUser={currentUser} />
          </TabsContent>
          )}

          <TabsContent value="calculator" className="space-y-6">
            <PayrollCalculator onRecorded={fetchStats} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <PayoutsReport refreshToken={stats.monthlyHourlyPayouts + stats.monthlyProjectPayouts} isAdmin={isAdmin} currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Settings onStatsUpdate={fetchStats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}