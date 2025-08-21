import { useState } from "react";
import { Settings as SettingsIcon, Users, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeList } from "./EmployeeList";
import { EmployeeForm } from "./EmployeeForm";

interface SettingsProps {
  onStatsUpdate?: () => void;
}

export function Settings({ onStatsUpdate }: SettingsProps) {
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const handleEmployeeSuccess = () => {
    setShowEmployeeForm(false);
    setEditingEmployee(null);
    onStatsUpdate?.(); // Refresh stats after employee changes
  };

  const handleEmployeeClose = () => {
    setShowEmployeeForm(false);
    setEditingEmployee(null);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-accent" />
                Settings
              </CardTitle>
              <CardDescription>
                Manage your team and application settings
              </CardDescription>
            </div>
            <Button 
              variant="gradient" 
              onClick={() => setShowEmployeeForm(true)}
              className="shadow-elegant"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="team" className="space-y-6">
            <TabsList className="grid w-full grid-cols-1 lg:w-[200px]">
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Management
              </TabsTrigger>
            </TabsList>

            <TabsContent value="team" className="space-y-6">
              <EmployeeList 
                onAddEmployee={() => setShowEmployeeForm(true)}
                onEditEmployee={(employee) => {
                  setEditingEmployee(employee);
                  setShowEmployeeForm(true);
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Employee Form Modal */}
      {showEmployeeForm && (
        <EmployeeForm 
          employee={editingEmployee}
          onClose={handleEmployeeClose}
          onSuccess={handleEmployeeSuccess}
        />
      )}
    </div>
  );
}