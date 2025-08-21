import { useState, useEffect } from "react";
import { User, Mail, Phone, Building, Briefcase, Edit, Trash2, Clock, Percent, Eye, Search, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EmployeeProfile } from "./EmployeeProfile";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  status: 'active' | 'inactive' | 'on_leave';
  pay_scale_type: 'hourly' | 'project';
  hourly_rate?: number;
  project_rate_1_member?: number;
  project_rate_2_members?: number;
  project_rate_3_members?: number;
  project_rate_4_members?: number;
  project_rate_5_members?: number;
  is_admin: boolean;
}

interface EmployeeListProps {
  onAddEmployee: () => void;
  onEditEmployee: (employee: Employee) => void;
}

export function EmployeeList({ onAddEmployee, onEditEmployee }: EmployeeListProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [profileEmployee, setProfileEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    // Filter employees based on search term
    const filtered = employees.filter(employee => {
      const searchLower = searchTerm.toLowerCase();
      return (
        employee.name.toLowerCase().includes(searchLower) ||
        employee.email.toLowerCase().includes(searchLower) ||
        (employee.phone && employee.phone.toLowerCase().includes(searchLower)) ||
        employee.department.toLowerCase().includes(searchLower) ||
        employee.position.toLowerCase().includes(searchLower) ||
        (employee.is_admin && 'admin'.includes(searchLower)) ||
        (!employee.is_admin && 'regular'.includes(searchLower))
      );
    });
    setFilteredEmployees(filtered);
  }, [employees, searchTerm]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
      setFilteredEmployees(data || []);
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

  const deleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setEmployees(employees.filter(emp => emp.id !== id));
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'inactive': return 'bg-destructive text-destructive-foreground';
      case 'on_leave': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatRate = (employee: Employee) => {
    if (employee.pay_scale_type === 'hourly') {
      return `$${employee.hourly_rate || 0}/hr`;
    } else {
      return `${employee.project_rate_1_member || 0}% (solo)`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>No employees found</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            Start building your team by adding your first employee
          </p>
          <Button onClick={onAddEmployee} variant="gradient">
            Add First Employee
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Team Members</h2>
          <p className="text-muted-foreground">Manage your team and their pay rates</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name, email, phone, or type 'admin'..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredEmployees.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No employees found matching your search' : 'No employees found'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredEmployees.map((employee) => (
        <Card key={employee.id} className="shadow-card hover:shadow-hover transition-smooth">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  {employee.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {employee.department}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {employee.position}
                  </span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(employee.status)}>
                  {employee.status.replace('_', ' ')}
                </Badge>
                {employee.is_admin && (
                  <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setProfileEmployee(employee)}
                  aria-label="View profile"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onEditEmployee(employee)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => deleteEmployee(employee.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Contact</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {employee.email}
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {employee.phone}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Pay Scale</h4>
                <div className="flex items-center gap-2">
                  {employee.pay_scale_type === 'hourly' ? (
                    <Clock className="h-4 w-4 text-accent" />
                  ) : (
                    <Percent className="h-4 w-4 text-accent" />
                  )}
                  <span className="font-medium">{formatRate(employee)}</span>
                </div>
              </div>

              {employee.pay_scale_type === 'project' && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Collaboration Rates</h4>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <span>2: {employee.project_rate_2_members}%</span>
                    <span>3: {employee.project_rate_3_members}%</span>
                    <span>4: {employee.project_rate_4_members}%</span>
                    <span>5: {employee.project_rate_5_members}%</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
      )}

      {profileEmployee && (
        <EmployeeProfile 
          employee={profileEmployee} 
          onClose={() => setProfileEmployee(null)} 
        />
      )}
    </div>
  );
}