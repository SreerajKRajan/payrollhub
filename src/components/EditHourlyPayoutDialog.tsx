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

interface TimeEntryData {
  id: string;
  employee_id: string;
  employee_name: string;
  check_in_time: string;
  check_out_time: string;
  rate: number;
  isTimeEntry: true;
}

interface EditHourlyPayoutDialogProps {
  data: Payout | TimeEntryData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function EditHourlyPayoutDialog({ data, open, onOpenChange, onSaved }: EditHourlyPayoutDialogProps) {
  const [clockInTime, setClockInTime] = useState("");
  const [clockOutTime, setClockOutTime] = useState("");
  const [editReason, setEditReason] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const isTimeEntry = 'isTimeEntry' in data && data.isTimeEntry;
  const rate = 'rate' in data ? data.rate : 0;

  // Helper to convert UTC date to local datetime-local format
  const toLocalDateTimeString = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

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
  const totalAmount = totalHours * rate;

  useEffect(() => {
    // Initialize form with existing values
    if (isTimeEntry) {
      const timeEntry = data as TimeEntryData;
      setClockInTime(toLocalDateTimeString(timeEntry.check_in_time));
      setClockOutTime(toLocalDateTimeString(timeEntry.check_out_time));
      setEditReason("");
    } else {
      const payout = data as Payout;
      if (payout.clock_in_time) {
        setClockInTime(toLocalDateTimeString(payout.clock_in_time));
      }
      if (payout.clock_out_time) {
        setClockOutTime(toLocalDateTimeString(payout.clock_out_time));
      }
      setEditReason(payout.edit_reason || "");
    }
  }, [data, isTimeEntry]);

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
      if (isTimeEntry) {
        // For time entries, update the existing time_entries record (no new payout)
        const timeEntry = data as TimeEntryData;
        const { error } = await supabase
          .from("time_entries")
          .update({
            check_in_time: new Date(clockInTime).toISOString(),
            check_out_time: new Date(clockOutTime).toISOString(),
            total_hours: totalHours,
            // Store the reason in notes for audit (without schema changes)
            notes: `[Edited] ${new Date().toISOString()} - ${editReason.trim()}`,
          })
          .eq("id", timeEntry.id);

        if (error) throw error;
      } else {
        // For existing payouts, update the record
        const payout = data as Payout;
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
      }

      toast({
        title: "Success",
        description: "Payout record updated successfully",
      });

      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving payout:", error);
      toast({
        title: "Error",
        description: "Failed to save payout record",
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
          <DialogTitle>Edit Hourly Payout - {data.employee_name}</DialogTitle>
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
              <span className="font-medium">${rate.toFixed(2)}/hr</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Hours:</span>
              <span className="font-medium">{totalHours} hrs</span>
            </div>
            <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
              <span>Total Amount:</span>
              <span className="text-primary">${totalAmount}</span>
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
