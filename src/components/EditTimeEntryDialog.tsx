import { useState } from "react";
import { Edit3, Trash2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addMinutes } from "date-fns";

interface TimeEntry {
  id: string;
  employee_id: string;
  employee_name: string;
  check_in_time: string;
  check_out_time?: string;
  total_hours?: number;
  status: string;
  notes?: string;
  created_at: string;
  timezone_offset?: number;
}

interface EditTimeEntryDialogProps {
  entry: TimeEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function EditTimeEntryDialog({ entry, open, onOpenChange, onSaved }: EditTimeEntryDialogProps) {
  // Helper: Convert UTC to local time using stored timezone offset
  const toLocalTime = (utcTime: string, timezoneOffset?: number) => {
    const date = new Date(utcTime);
    const offset = timezoneOffset !== undefined ? timezoneOffset : new Date().getTimezoneOffset();
    return addMinutes(date, -offset);
  };

  // Helper: Get timezone display
  const getTimezoneDisplay = () => {
    const offset = entry.timezone_offset !== undefined ? entry.timezone_offset : new Date().getTimezoneOffset();
    const offsetHours = Math.abs(offset) / 60;
    const sign = offset <= 0 ? '+' : '-';
    return `UTC${sign}${offsetHours.toFixed(1)}`;
  };

  const localCheckIn = toLocalTime(entry.check_in_time, entry.timezone_offset);
  const localCheckOut = entry.check_out_time ? toLocalTime(entry.check_out_time, entry.timezone_offset) : null;

  const [formData, setFormData] = useState({
    check_in_time: format(localCheckIn, 'HH:mm'),
    check_out_time: localCheckOut ? format(localCheckOut, 'HH:mm') : '',
    notes: entry.notes || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Work with local times and convert to UTC for storage
      const baseDate = toLocalTime(entry.check_in_time, entry.timezone_offset);

      // Create new local times with updated times
      const [checkInHours, checkInMinutes] = formData.check_in_time.split(':');
      const newLocalCheckIn = new Date(baseDate);
      newLocalCheckIn.setHours(parseInt(checkInHours), parseInt(checkInMinutes), 0, 0);

      // Convert local time back to UTC for storage
      const offset = entry.timezone_offset !== undefined ? entry.timezone_offset : new Date().getTimezoneOffset();
      const newCheckInTimeUTC = addMinutes(newLocalCheckIn, offset);

      let newCheckOutTimeUTC = null;
      let calculatedHours = null;
      
      if (formData.check_out_time) {
        const [checkOutHours, checkOutMinutes] = formData.check_out_time.split(':');
        const newLocalCheckOut = new Date(baseDate);
        newLocalCheckOut.setHours(parseInt(checkOutHours), parseInt(checkOutMinutes), 0, 0);
        
        // Handle case where checkout is next day
        if (newLocalCheckOut < newLocalCheckIn) {
          newLocalCheckOut.setDate(newLocalCheckOut.getDate() + 1);
        }
        
        // Convert to UTC
        newCheckOutTimeUTC = addMinutes(newLocalCheckOut, offset);
        
        // Calculate total hours
        const timeDiff = newCheckOutTimeUTC.getTime() - newCheckInTimeUTC.getTime();
        calculatedHours = timeDiff / (1000 * 60 * 60); // Convert to hours
      }

      console.log('💾 Saving time entry:', {
        checkIn: newCheckInTimeUTC.toISOString(),
        checkOut: newCheckOutTimeUTC?.toISOString(),
        hours: calculatedHours,
        timezone: getTimezoneDisplay()
      });

      const updateData: any = {
        check_in_time: newCheckInTimeUTC.toISOString(),
        notes: formData.notes || null,
      };

      if (newCheckOutTimeUTC) {
        updateData.check_out_time = newCheckOutTimeUTC.toISOString();
        updateData.total_hours = calculatedHours;
        updateData.status = 'checked_out';
      } else if (entry.check_out_time) {
        // If removing checkout time
        updateData.check_out_time = null;
        updateData.total_hours = null;
        updateData.status = 'checked_in';
      }

      const { error } = await supabase
        .from('time_entries')
        .update(updateData)
        .eq('id', entry.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time entry updated successfully",
      });
      
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating time entry:', error);
      toast({
        title: "Error",
        description: "Failed to update time entry",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this time entry? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', entry.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time entry deleted successfully",
      });
      
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting time entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete time entry",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Time Entry</DialogTitle>
          <DialogDescription>
            Modify the time entry for {entry.employee_name} on {format(localCheckIn, 'MMM dd, yyyy')}
          </DialogDescription>
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <Globe className="h-3 w-3" />
            <span>Times shown in: {getTimezoneDisplay()}</span>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="check_in_time">Check-in Time</Label>
            <Input
              id="check_in_time"
              type="time"
              value={formData.check_in_time}
              onChange={(e) => setFormData(prev => ({ ...prev, check_in_time: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="check_out_time">Check-out Time</Label>
            <Input
              id="check_out_time"
              type="time"
              value={formData.check_out_time}
              onChange={(e) => setFormData(prev => ({ ...prev, check_out_time: e.target.value }))}
              placeholder="Leave empty if still checked in"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          
          <div className="flex-1" />
          
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="gap-2"
          >
            <Edit3 className="h-4 w-4" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}