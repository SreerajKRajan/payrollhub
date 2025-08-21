import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmployeeFormProps {
  onClose: () => void;
  onSuccess: () => void;
  employee?: Employee | null;
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
  hourly_rate?: number;
  project_rate_1_member?: number;
  project_rate_2_members?: number;
  project_rate_3_members?: number;
  project_rate_4_members?: number;
  project_rate_5_members?: number;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  status: 'active' | 'inactive' | 'on_leave';
  pay_scale_type: 'hourly' | 'project';
  hourly_rate: string;
  project_rate_1_member: string;
  project_rate_2_members: string;
  project_rate_3_members: string;
  project_rate_4_members: string;
  project_rate_5_members: string;
}

export function EmployeeForm({ onClose, onSuccess, employee }: EmployeeFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: employee?.name || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    department: employee?.department || '',
    position: employee?.position || '',
    status: employee?.status || 'active',
    pay_scale_type: employee?.pay_scale_type || 'hourly',
    hourly_rate: employee?.hourly_rate?.toString() || '',
    project_rate_1_member: employee?.project_rate_1_member?.toString() || '',
    project_rate_2_members: employee?.project_rate_2_members?.toString() || '',
    project_rate_3_members: employee?.project_rate_3_members?.toString() || '',
    project_rate_4_members: employee?.project_rate_4_members?.toString() || '',
    project_rate_5_members: employee?.project_rate_5_members?.toString() || '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const employeeData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        department: formData.department,
        position: formData.position,
        status: formData.status,
        pay_scale_type: formData.pay_scale_type,
      };

      if (formData.pay_scale_type === 'hourly') {
        employeeData.hourly_rate = parseFloat(formData.hourly_rate) || null;
      } else {
        employeeData.project_rate_1_member = parseFloat(formData.project_rate_1_member) || null;
        employeeData.project_rate_2_members = parseFloat(formData.project_rate_2_members) || null;
        employeeData.project_rate_3_members = parseFloat(formData.project_rate_3_members) || null;
        employeeData.project_rate_4_members = parseFloat(formData.project_rate_4_members) || null;
        employeeData.project_rate_5_members = parseFloat(formData.project_rate_5_members) || null;
      }

      if (employee) {
        // Update existing employee
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', employee.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Employee updated successfully",
        });
      } else {
        // Add new employee
        const { error } = await supabase
          .from('employees')
          .insert([employeeData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Employee added successfully",
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error(`Error ${employee ? 'updating' : 'adding'} employee:`, error);
      toast({
        title: "Error",
        description: `Failed to ${employee ? 'update' : 'add'} employee`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{employee ? 'Edit Team Member' : 'Add Team Member'}</CardTitle>
            <CardDescription>
              {employee ? 'Update employee profile and pay settings' : 'Create a new employee profile with pay settings'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Pay Scale Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Pay Scale Settings</h3>
              <div className="space-y-2">
                <Label>Pay Scale Type</Label>
                <Select 
                  value={formData.pay_scale_type} 
                  onValueChange={(value: any) => handleInputChange('pay_scale_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Per Hour</SelectItem>
                    <SelectItem value="project">Per Project (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.pay_scale_type === 'hourly' ? (
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    value={formData.hourly_rate}
                    onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                    placeholder="25.00"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Set percentage rates based on collaboration level
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rate_1">1 Member (Solo) %</Label>
                      <Input
                        id="rate_1"
                        type="number"
                        step="0.01"
                        max="100"
                        value={formData.project_rate_1_member}
                        onChange={(e) => handleInputChange('project_rate_1_member', e.target.value)}
                        placeholder="30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rate_2">2 Members %</Label>
                      <Input
                        id="rate_2"
                        type="number"
                        step="0.01"
                        max="100"
                        value={formData.project_rate_2_members}
                        onChange={(e) => handleInputChange('project_rate_2_members', e.target.value)}
                        placeholder="20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rate_3">3 Members %</Label>
                      <Input
                        id="rate_3"
                        type="number"
                        step="0.01"
                        max="100"
                        value={formData.project_rate_3_members}
                        onChange={(e) => handleInputChange('project_rate_3_members', e.target.value)}
                        placeholder="15"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rate_4">4 Members %</Label>
                      <Input
                        id="rate_4"
                        type="number"
                        step="0.01"
                        max="100"
                        value={formData.project_rate_4_members}
                        onChange={(e) => handleInputChange('project_rate_4_members', e.target.value)}
                        placeholder="12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rate_5">5 Members %</Label>
                      <Input
                        id="rate_5"
                        type="number"
                        step="0.01"
                        max="100"
                        value={formData.project_rate_5_members}
                        onChange={(e) => handleInputChange('project_rate_5_members', e.target.value)}
                        placeholder="10"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={loading} className="flex-1">
                {loading ? (employee ? "Updating..." : "Adding...") : (employee ? "Update Employee" : "Add Employee")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}