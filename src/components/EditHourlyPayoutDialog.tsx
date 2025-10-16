import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Payout {
  id: string;
  employee_id: string;
  employee_name: string;
  calculation_type: string;
  amount: number;
  rate: number;
  project_value?: number | null;
  hours_worked?: number | null;
  collaborators_count?: number | null;
  project_title?: string | null;
  source?: string;
  created_at: string;
  clock_in_time?: string | null;
  clock_out_time?: string | null;
  edit_reason?: string | null;
  is_edited?: boolean;
}

interface EditHourlyPayoutDialogProps {
  payout: Payout;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function EditHourlyPayoutDialog({ payout, open, onOpenChange, onSaved }: EditHourlyPayoutDialogProps) {
  const [clockInTime, setClockInTime] = useState("");
  const [clockOutTime, setClockOutTime] = useState("");
  const [editReason, setEditReason] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Calculate total hours
  const calculateHours = () => {
    if (!clockInTime || !clockOutTime) return 0;
    const checkIn = new Date(clockInTime);
    const checkOut = new Date(clockOutTime);
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    return hours > 0 ? hours : 0;
  };

  const totalHours = calculateHours();
  const totalAmount = totalHours * payout.rate;

  useEffect(() => {
    // Initialize form with existing values
    if (payout.clock_in_time) {
      setClockInTime(new Date(payout.clock_in_time).toISOString().slice(0, 16));
    }
    if (payout.clock_out_time) {
      setClockOutTime(new Date(payout.clock_out_time).toISOString().slice(0, 16));
    }
    setEditReason(payout.edit_reason || "");
  }, [payout]);

  const handleSave = async () => {
    if (!clockInTime || !clockOutTime) {
      toast({
        title: "Error",
        description: "Please provide both clock in and clock out times",
        variant: "destructive",
      });
      return;
    }

    if (!editReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for this edit",
        variant: "destructive",
      });
      return;
    }

    if (totalHours <= 0) {
      toast({
        title: "Error",
        description: "Clock out time must be after clock in time",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("payouts")
        .update({
          clock_in_time: new Date(clockInTime).toISOString(),
          clock_out_time: new Date(clockOutTime).toISOString(),
          hours_worked: totalHours,
          amount: totalAmount,
          edit_reason: editReason.trim(),
          is_edited: true,
        })
        .eq("id", payout.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payout record updated successfully",
      });

      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating payout:", error);
      toast({
        title: "Error",
        description: "Failed to update payout record",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Hourly Payout - {payout.employee_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="clockIn">Clock In Time *</Label>
            <Input
              id="clockIn"
              type="datetime-local"
              value={clockInTime}
              onChange={(e) => setClockInTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clockOut">Clock Out Time *</Label>
            <Input
              id="clockOut"
              type="datetime-local"
              value={clockOutTime}
              onChange={(e) => setClockOutTime(e.target.value)}
            />
          </div>

          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Hourly Rate:</span>
              <span className="font-medium">${payout.rate.toFixed(2)}/hr</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Hours:</span>
              <span className="font-medium">{totalHours.toFixed(2)} hrs</span>
            </div>
            <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
              <span>Total Amount:</span>
              <span className="text-primary">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editReason">Reason for Edit *</Label>
            <Textarea
              id="editReason"
              placeholder="Please provide a reason for this edit (required for audit purposes)"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
