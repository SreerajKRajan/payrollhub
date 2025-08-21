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
  const [quotedByBonusPercentage, setQuotedByBonusPercentage] = useState("2");
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

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['first_time_bonus_percentage', 'quoted_by_bonus_percentage']);

        if (error) {
          console.error('Error loading settings:', error);
          return;
        }

        if (data) {
          data.forEach(setting => {
            if (setting.setting_key === 'first_time_bonus_percentage') {
              setFirstTimeBonusPercentage(setting.setting_value);
            } else if (setting.setting_key === 'quoted_by_bonus_percentage') {
              setQuotedByBonusPercentage(setting.setting_value);
            }
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleSettingUpdate = async (settingKey: string, value: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ setting_value: value })
        .eq('setting_key', settingKey);

      if (error) {
        console.error(`Error updating ${settingKey}:`, error);
        toast({
          title: "Error",
          description: `Failed to update ${settingKey.replace('_', ' ')}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `${settingKey.replace('_', ' ')} updated successfully`,
      });
    } catch (error) {
      console.error(`Error updating ${settingKey}:`, error);
      toast({
        title: "Error",
        description: `Failed to update ${settingKey.replace('_', ' ')}`,
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
                    Payroll Bonus Settings
                  </CardTitle>
                  <CardDescription>
                    Configure bonus percentages for different project scenarios
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">First Time Project Bonus</h4>
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
                        onClick={() => handleSettingUpdate('first_time_bonus_percentage', firstTimeBonusPercentage)}
                        disabled={isLoading}
                        variant="gradient"
                      >
                        {isLoading ? "Updating..." : "Update"}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Bonus for the quoted-by employee on first-time projects: {firstTimeBonusPercentage}%
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Quoted By Bonus (Regular Projects)</h4>
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <Label htmlFor="quotedByBonusPercentage">Percentage (%)</Label>
                        <Input
                          id="quotedByBonusPercentage"
                          type="number"
                          min="0"
                          max="100"
                          value={quotedByBonusPercentage}
                          onChange={(e) => setQuotedByBonusPercentage(e.target.value)}
                          placeholder="Enter percentage (e.g., 2)"
                        />
                      </div>
                      <Button 
                        onClick={() => handleSettingUpdate('quoted_by_bonus_percentage', quotedByBonusPercentage)}
                        disabled={isLoading}
                        variant="gradient"
                      >
                        {isLoading ? "Updating..." : "Update"}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Bonus for the quoted-by employee on regular (non-first-time) projects: {quotedByBonusPercentage}%
                    </p>
                  </div>
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