import { useState } from "react";
import { Users, Calculator, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeList } from "./EmployeeList";
import { EmployeeForm } from "./EmployeeForm";
import { PayrollCalculator } from "./PayrollCalculator";

export function PayrollDashboard() {
  const [activeTab, setActiveTab] = useState("employees");
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const stats = [
    {
      title: "Total Employees",
      value: "0",
      description: "Active team members",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Avg. Hourly Rate",
      value: "$0",
      description: "Across all employees",
      icon: DollarSign,
      color: "text-success",
    },
    {
      title: "Project Payouts",
      value: "$0",
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
          <Button 
            variant="gradient" 
            size="lg"
            onClick={() => setShowEmployeeForm(true)}
            className="shadow-elegant"
          >
            <Users className="h-5 w-5" />
            Add Team Member
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
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

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employees
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-6">
            <EmployeeList 
              onAddEmployee={() => setShowEmployeeForm(true)}
              onEditEmployee={(employee) => {
                setEditingEmployee(employee);
                setShowEmployeeForm(true);
              }}
            />
          </TabsContent>

          <TabsContent value="calculator" className="space-y-6">
            <PayrollCalculator />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Payroll Reports</CardTitle>
                <CardDescription>
                  Detailed analytics and reports coming soon
                </CardDescription>
              </CardHeader>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Advanced reporting features will be available in the next update
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Employee Form Modal */}
        {showEmployeeForm && (
          <EmployeeForm 
            employee={editingEmployee}
            onClose={() => {
              setShowEmployeeForm(false);
              setEditingEmployee(null);
            }} 
            onSuccess={() => {
              setShowEmployeeForm(false);
              setEditingEmployee(null);
            }}
          />
        )}
      </div>
    </div>
  );
}