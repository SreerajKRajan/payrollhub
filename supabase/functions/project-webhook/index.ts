import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  project_value: number;
  project_title: string;
  quoted_by_name: string;
  first_time: boolean;
  employees_assigned: string[]; // Array of employee names
  job_id?: string; // Optional unique job identifier from external system
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: WebhookPayload = await req.json();
    console.log('Received webhook payload:', payload);

    // Validate required fields
    if (!payload.project_value || !payload.project_title || !payload.employees_assigned?.length) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find employees by names
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, name, pay_scale_type, project_rate_1_member, project_rate_2_members, project_rate_3_members, project_rate_4_members, project_rate_5_members')
      .in('name', payload.employees_assigned)
      .eq('status', 'active')
      .eq('pay_scale_type', 'project');

    if (employeesError) {
      console.error('Error fetching employees:', employeesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch employees' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!employees || employees.length === 0) {
      return new Response(JSON.stringify({ error: 'No matching project-based employees found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find quoted by employee
    let quotedByEmployee = null;
    if (payload.quoted_by_name) {
      const { data: quotedBy, error: quotedByError } = await supabase
        .from('employees')
        .select('id, name')
        .eq('name', payload.quoted_by_name)
        .maybeSingle();
      
      if (quotedByError) {
        console.warn('Error finding quoted by employee:', quotedByError);
      } else {
        quotedByEmployee = quotedBy;
      }
      
      console.log('Quoted by lookup result:', { 
        searched_name: payload.quoted_by_name, 
        found_employee: quotedByEmployee 
      });
    }

    const collaboratorsCount = employees.length;
    const payouts = [];

    // Calculate payouts for each employee
    for (const employee of employees) {
      let rate = 0;
      
      // Determine rate based on collaborators count
      switch (collaboratorsCount) {
        case 1:
          rate = employee.project_rate_1_member || 0;
          break;
        case 2:
          rate = employee.project_rate_2_members || 0;
          break;
        case 3:
          rate = employee.project_rate_3_members || 0;
          break;
        case 4:
          rate = employee.project_rate_4_members || 0;
          break;
        case 5:
          rate = employee.project_rate_5_members || 0;
          break;
        default:
          rate = employee.project_rate_5_members || 0; // Use 5+ rate for more than 5 collaborators
      }

      if (rate === 0) {
        console.warn(`No rate found for employee ${employee.name} with ${collaboratorsCount} collaborators`);
        continue;
      }

      const baseAmount = (payload.project_value * rate) / 100;
      
      // Regular payout
      const regularPayout = {
        employee_id: employee.id,
        employee_name: employee.name,
        calculation_type: 'project',
        amount: baseAmount,
        rate: rate,
        project_value: payload.project_value,
        collaborators_count: collaboratorsCount,
        project_title: payload.project_title,
        quoted_by_id: quotedByEmployee?.id || null,
        quoted_by_name: quotedByEmployee?.name || payload.quoted_by_name || null,
        is_first_time: false,
        source: 'auto',
        job_id: payload.job_id || null,
      };

      payouts.push(regularPayout);

    }

    // First-time bonus payout assigned ONLY to the quoted-by employee
    if (payload.first_time && quotedByEmployee) {
      // Fetch configurable first time bonus percentage
      const { data: bonusSettingData, error: bonusSettingError } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'first_time_bonus_percentage')
        .maybeSingle();

      let bonusRate = 30; // default fallback
      if (bonusSettingError) {
        console.warn('Error fetching first time bonus percentage, using default 30%:', bonusSettingError);
      } else if (bonusSettingData) {
        bonusRate = parseFloat(bonusSettingData.setting_value) || 30;
      }

      const bonusAmount = (payload.project_value * bonusRate) / 100;

      payouts.push({
        employee_id: quotedByEmployee.id,
        employee_name: `${quotedByEmployee.name} (First Time Bonus)`,
        calculation_type: 'project',
        amount: bonusAmount,
        rate: bonusRate,
        project_value: payload.project_value,
        collaborators_count: collaboratorsCount,
        project_title: payload.project_title,
        quoted_by_id: quotedByEmployee.id,
        quoted_by_name: quotedByEmployee.name,
        is_first_time: true,
        source: 'auto',
        job_id: payload.job_id || null,
      });
    }
    
    // Regular quoted-by bonus for non-first-time projects
    if (!payload.first_time && quotedByEmployee) {
      // Fetch configurable quoted-by bonus percentage
      const { data: quotedByBonusData, error: quotedByBonusError } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'quoted_by_bonus_percentage')
        .maybeSingle();

      let quotedByBonusRate = 2; // default fallback
      if (quotedByBonusError) {
        console.warn('Error fetching quoted by bonus percentage, using default 2%:', quotedByBonusError);
      } else if (quotedByBonusData) {
        quotedByBonusRate = parseFloat(quotedByBonusData.setting_value) || 2;
      }

      const quotedByBonusAmount = (payload.project_value * quotedByBonusRate) / 100;

      payouts.push({
        employee_id: quotedByEmployee.id,
        employee_name: `${quotedByEmployee.name} (Quoted By Bonus)`,
        calculation_type: 'project',
        amount: quotedByBonusAmount,
        rate: quotedByBonusRate,
        project_value: payload.project_value,
        collaborators_count: collaboratorsCount,
        project_title: payload.project_title,
        quoted_by_id: quotedByEmployee.id,
        quoted_by_name: quotedByEmployee.name,
        is_first_time: false,
        source: 'auto',
        job_id: payload.job_id || null,
      });
    }

    if (payouts.length === 0) {
      return new Response(JSON.stringify({ error: 'No payouts could be calculated' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for existing payouts to prevent duplicates
    // Only check if job_id is provided - use job_id for exact duplicate detection
    const employeeIds = employees.map(emp => emp.id);
    
    if (payload.job_id) {
      console.log('Checking for duplicates using job_id:', payload.job_id);
      
      const { data: existingPayouts, error: checkError } = await supabase
        .from('payouts')
        .select('id, employee_id, employee_name, job_id')
        .eq('job_id', payload.job_id)
        .eq('source', 'auto')
        .in('employee_id', employeeIds);

      if (checkError) {
        console.error('Error checking for existing payouts:', checkError);
        return new Response(JSON.stringify({ error: 'Failed to check for duplicates' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (existingPayouts && existingPayouts.length > 0) {
        console.log('Duplicate payouts detected by job_id. Existing payouts:', existingPayouts);
        return new Response(JSON.stringify({ 
          error: 'Duplicate payouts', 
          message: `Payouts for job_id "${payload.job_id}" already exist for these employees`,
          existing_payouts: existingPayouts 
        }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      console.log('No job_id provided - skipping duplicate detection (allowing payout creation)');
    }

    // Insert payouts
    const { data: insertedPayouts, error: payoutsError } = await supabase
      .from('payouts')
      .insert(payouts)
      .select();

    if (payoutsError) {
      console.error('Error inserting payouts:', payoutsError);
      return new Response(JSON.stringify({ error: 'Failed to create payouts' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully created payouts:', insertedPayouts);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Created ${payouts.length} payouts for project "${payload.project_title}"`,
      payouts: insertedPayouts 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in project-webhook function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});