import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditPayoutDialogProps {
  payout: {
    id: string;
    employee_id: string;
    employee_name: string;
    calculation_type: string;
    amount: number;
    rate: number;
    project_value: number | null;
    hours_worked: number | null;
    collaborators_count: number | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function EditPayoutDialog({ payout, open, onOpenChange, onSaved }: EditPayoutDialogProps) {
  const [form, setForm] = useState({
    amount: payout.amount?.toString() ?? '',
    rate: payout.rate?.toString() ?? '',
    project_value: payout.project_value?.toString() ?? '',
    hours_worked: payout.hours_worked?.toString() ?? '',
    collaborators_count: payout.collaborators_count?.toString() ?? '',
  });
  const [saving, setSaving] = useState(false);
  type FormKey = 'amount' | 'rate' | 'project_value' | 'hours_worked' | 'collaborators_count';
  const [lastEdited, setLastEdited] = useState<FormKey | null>(null);
  const { toast } = useToast();

  // Reset form when payout changes
  useEffect(() => {
    setForm({
      amount: payout.amount?.toString() ?? '',
      rate: payout.rate?.toString() ?? '',
      project_value: payout.project_value?.toString() ?? '',
      hours_worked: payout.hours_worked?.toString() ?? '',
      collaborators_count: payout.collaborators_count?.toString() ?? '',
    });
    setLastEdited(null);
  }, [payout]);


  // Recalculate amount based on last edited field
  useEffect(() => {
    if (payout.calculation_type !== 'project') return;
    if (!lastEdited || lastEdited === 'amount') return; // Don't recalculate if user is editing amount directly

    const projectValue = parseFloat(form.project_value);
    const rate = parseFloat(form.rate);
    const collabCount = parseInt(form.collaborators_count) || 1;

    if (isNaN(projectValue) || projectValue <= 0 || isNaN(rate) || rate <= 0) {
      setLastEdited(null);
      return;
    }

    const amount = (projectValue * rate) / 100 / Math.max(collabCount, 1);
    setForm(prev => ({ ...prev, amount: amount.toFixed(2) }));
    setLastEdited(null);
  }, [form.project_value, form.rate, form.collaborators_count, payout.calculation_type, lastEdited]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setLastEdited(key as FormKey);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const update: any = {
        amount: form.amount !== '' ? Number(form.amount) : null,
        rate: form.rate !== '' ? Number(form.rate) : null,
        collaborators_count: form.collaborators_count !== '' ? Number(form.collaborators_count) : null,
      };
      if (payout.calculation_type === 'project') {
        update.project_value = form.project_value !== '' ? Number(form.project_value) : null;
        update.hours_worked = null;
      } else {
        update.hours_worked = form.hours_worked !== '' ? Number(form.hours_worked) : null;
        update.project_value = null;
      }

      const { error } = await supabase.from('payouts').update(update).eq('id', payout.id);
      if (error) throw error;

      toast({ title: 'Updated', description: 'Payout updated successfully' });
      onSaved();
    } catch (err) {
      console.error('Failed to update payout', err);
      toast({ title: 'Error', description: 'Failed to update payout', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Payout</DialogTitle>
          <DialogDescription>
            Update payout details for {payout.employee_name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input type="number" step="0.01" value={form.amount} onChange={(e) => handleChange('amount', e.target.value)} aria-label="Amount in dollars" />
            </div>
            <div className="space-y-2">
              <Label>Rate ({payout.calculation_type === 'project' ? '%' : '/hr'})</Label>
              <Input type="number" step="0.01" value={form.rate} onChange={(e) => handleChange('rate', e.target.value)} aria-label="Rate percent" />
            </div>
            {payout.calculation_type === 'project' ? (
              <div className="space-y-2 md:col-span-2">
                <Label>Project Value ($)</Label>
                <Input type="number" step="0.01" value={form.project_value} onChange={(e) => handleChange('project_value', e.target.value)} aria-label="Project value in dollars" />
              </div>
            ) : (
              <div className="space-y-2 md:col-span-2">
                <Label>Hours Worked</Label>
                <Input type="number" step="0.25" value={form.hours_worked} onChange={(e) => handleChange('hours_worked', e.target.value)} aria-label="Hours worked" />
              </div>
            )}
            <div className="space-y-2 md:col-span-2">
              <Label>Collaborators Count</Label>
              <Input type="number" step="1" value={form.collaborators_count} onChange={(e) => handleChange('collaborators_count', e.target.value)} aria-label="Collaborators count" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
            <Button type="submit" variant="gradient" disabled={saving} className="flex-1">{saving ? 'Saving…' : 'Save Changes'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
