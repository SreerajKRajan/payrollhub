import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";

export interface UserTimezoneInfo {
  timezone: string;
  offset: string; // e.g., "UTC-5" or "UTC-6"
  abbreviation: string; // e.g., "CDT" or "CST"
  isLoading: boolean;
}

export function useUserTimezone(userEmail?: string | null) {
  const [timezoneInfo, setTimezoneInfo] = useState<UserTimezoneInfo>({
    timezone: "America/Chicago",
    offset: "",
    abbreviation: "",
    isLoading: true,
  });

  useEffect(() => {
    const loadUserTimezone = async () => {
      if (!userEmail) {
        // No user email, use browser's detected timezone or default
        const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago";
        setTimezoneInfo({
          timezone: detectedTz,
          offset: getOffsetDisplay(detectedTz),
          abbreviation: getAbbreviation(detectedTz),
          isLoading: false,
        });
        console.log("🌍 No user email, using detected timezone:", detectedTz);
        return;
      }

      try {
        // Fetch user profile by email
        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("user_timezone")
          .eq("email", userEmail)
          .maybeSingle();

        if (error) throw error;

        let userTz = profile?.user_timezone || "America/Chicago";

        // If timezone is not set, detect and store it
        if (!profile || !profile.user_timezone || profile.user_timezone === "America/Chicago") {
          const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (detectedTz && detectedTz !== "America/Chicago") {
            userTz = detectedTz;
            // Update profile with detected timezone
            await supabase
              .from("user_profiles")
              .update({ user_timezone: detectedTz })
              .eq("email", userEmail);
            console.log("🌍 Auto-detected and stored timezone:", detectedTz);
          }
        }

        setTimezoneInfo({
          timezone: userTz,
          offset: getOffsetDisplay(userTz),
          abbreviation: getAbbreviation(userTz),
          isLoading: false,
        });

        console.log("🌍 User timezone loaded:", {
          timezone: userTz,
          offset: getOffsetDisplay(userTz),
          abbreviation: getAbbreviation(userTz),
        });
      } catch (error) {
        console.error("Error loading user timezone:", error);
        const fallbackTz = "America/Chicago";
        setTimezoneInfo({
          timezone: fallbackTz,
          offset: getOffsetDisplay(fallbackTz),
          abbreviation: getAbbreviation(fallbackTz),
          isLoading: false,
        });
      }
    };

    loadUserTimezone();
  }, [userEmail]);

  return timezoneInfo;
}

// Helper: Get offset display (e.g., "UTC-5")
function getOffsetDisplay(timezone: string): string {
  const now = new Date();
  const zonedTime = toZonedTime(now, timezone);
  const offsetMinutes = (now.getTime() - zonedTime.getTime()) / 60000;
  const offsetHours = -offsetMinutes / 60;
  const sign = offsetHours >= 0 ? "+" : "";
  return `UTC${sign}${offsetHours}`;
}

// Helper: Get timezone abbreviation (e.g., "CDT" or "CST")
function getAbbreviation(timezone: string): string {
  try {
    const formatted = formatInTimeZone(new Date(), timezone, "zzz");
    return formatted;
  } catch {
    return "";
  }
}

// Helper: Convert UTC time to user's local time
export function toUserLocalTime(utcTime: Date | string, timezone: string): Date {
  const date = typeof utcTime === "string" ? new Date(utcTime) : utcTime;
  return toZonedTime(date, timezone);
}

// Helper: Convert user's local time to UTC
export function fromUserLocalTime(localTime: Date, timezone: string): Date {
  return fromZonedTime(localTime, timezone);
}

// Helper: Get start of day in user's timezone as UTC Date
export function getStartOfDayInUserTz(timezone: string): Date {
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);
  zonedNow.setHours(0, 0, 0, 0);
  return fromZonedTime(zonedNow, timezone);
}
