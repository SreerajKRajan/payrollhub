import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Users, Plus, Percent } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmployeeList } from "./EmployeeList";
import { EmployeeForm } from "./EmployeeForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SettingsProps {
  onStatsUpdate?: () => void;
}

export function Settings({ onStatsUpdate }: SettingsProps) {
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [firstTimeBonusPercentage, setFirstTimeBonusPercentage] = useState("30");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEmployeeSuccess = () => {
    setShowEmployeeForm(false);
    setEditingEmployee(null);
    onStatsUpdate?.(); // Refresh stats after employee changes
  };

  const handleEmployeeClose = () => {
    setShowEmployeeForm(false);
    setEditingEmployee(null);
  };

  // Load first time bonus percentage on component mount
  useEffect(() => {
    const loadFirstTimeBonusPercentage = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'first_time_bonus_percentage')
          .maybeSingle();

        if (error) {
          console.error('Error loading first time bonus percentage:', error);
          return;
        }

        if (data) {
          setFirstTimeBonusPercentage(data.setting_value);
        }
      } catch (error) {
        console.error('Error loading first time bonus percentage:', error);
      }
    };

    loadFirstTimeBonusPercentage();
  }, []);

  const handleFirstTimeBonusPercentageUpdate = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ setting_value: firstTimeBonusPercentage })
        .eq('setting_key', 'first_time_bonus_percentage');

      if (error) {
        console.error('Error updating first time bonus percentage:', error);
        toast({
          title: "Error",
          description: "Failed to update first time bonus percentage",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "First time bonus percentage updated successfully",
      });
    } catch (error) {
      console.error('Error updating first time bonus percentage:', error);
      toast({
        title: "Error",
        description: "Failed to update first time bonus percentage",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Management
              </TabsTrigger>
              <TabsTrigger value="payroll" className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Payroll Settings
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

            <TabsContent value="payroll" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5 text-accent" />
                    First Time Bonus Percentage
                  </CardTitle>
                  <CardDescription>
                    Set the percentage bonus applied to the quoted-by employee for first-time projects
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <Label htmlFor="firstTimeBonusPercentage">Percentage (%)</Label>
                      <Input
                        id="firstTimeBonusPercentage"
                        type="number"
                        min="0"
                        max="100"
                        value={firstTimeBonusPercentage}
                        onChange={(e) => setFirstTimeBonusPercentage(e.target.value)}
                        placeholder="Enter percentage (e.g., 30)"
                      />
                    </div>
                    <Button 
                      onClick={handleFirstTimeBonusPercentageUpdate}
                      disabled={isLoading}
                      variant="gradient"
                    >
                      {isLoading ? "Updating..." : "Update"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Current setting: {firstTimeBonusPercentage}% bonus for first-time projects
                  </p>
                </CardContent>
              </Card>
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