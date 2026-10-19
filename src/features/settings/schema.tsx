import type { ReactNode } from "react";
import { FormField, NumberInput, TextInput, ToggleRow } from "@/components/ui";
import type { SettingsMap } from "@/types/models";

type Field =
  | { type: "number"; key: keyof SettingsMap; label: string; hint?: string }
  | { type: "text"; key: keyof SettingsMap; label: string; hint?: string }
  | { type: "toggle"; key: keyof SettingsMap; label: string }
  | { type: "note"; text: string };

export type SettingsSection = {
  title: string;
  fields: Field[];
};

export const settingsSections: SettingsSection[] = [
  {
    title: "OTP",
    fields: [
      { type: "number", key: "otpLength", label: "Code length (digits)", hint: "Allowed: 4–8" },
      { type: "number", key: "otpExpiry", label: "Code expiry (seconds)", hint: "Allowed: 60–1800" },
      { type: "number", key: "otpAttempts", label: "Attempts per code (attempts)", hint: "Allowed: 1–10" },
      { type: "number", key: "otpGap", label: "Gap between codes (seconds)", hint: "Allowed: 10–600" },
      { type: "number", key: "otpPerPhoneHourly", label: "Codes per phone, hourly (codes)", hint: "Allowed: 1–50" },
      { type: "number", key: "otpPerIpHourly", label: "Codes per IP, hourly (codes)", hint: "Allowed: 1–5000" },
    ],
  },
  {
    title: "Calls",
    fields: [
      { type: "number", key: "ringTimeout", label: "Ring timeout (seconds)", hint: "Allowed: 15–120" },
      {
        type: "number",
        key: "maxGroupCallParticipants",
        label: "Group-call participants (people)",
        hint: "Allowed: 2–100",
      },
    ],
  },
  {
    title: "Groups",
    fields: [{ type: "number", key: "maxGroupSize", label: "Maximum group size (members)", hint: "Allowed: 2–1024" }],
  },
  {
    title: "Media",
    fields: [{ type: "number", key: "uploadLimitMb", label: "Upload limit (MB)", hint: "Allowed: 1–2048" }],
  },
  {
    title: "Messages",
    fields: [
      { type: "number", key: "editWindowMinutes", label: "Edit window (minutes)", hint: "Allowed: 0–1440" },
    ],
  },
  {
    title: "General",
    fields: [{ type: "toggle", key: "maintenanceMode", label: "Maintenance mode" }],
  },
  {
    title: "Android",
    fields: [
      { type: "text", key: "latestAndroidVersion", label: "Latest app version" },
      { type: "number", key: "latestAndroidVersionCode", label: "Latest app versionCode" },
      { type: "text", key: "downloadUrl", label: "Download URL" },
    ],
  },
  {
    title: "SMS",
    fields: [
      { type: "toggle", key: "smsEnabled", label: "Send sign-in codes by SMS" },
      { type: "note", text: "Until this is switched on, a code is only readable from the OTP log." },
    ],
  },
  {
    title: "Privacy",
    fields: [
      { type: "toggle", key: "allowPeopleSearch", label: "Allow searching for people" },
      {
        type: "number",
        key: "minSearchChars",
        label: "Shortest name search (characters)",
        hint: "Allowed: 2–10",
      },
    ],
  },
];

export function renderSettingsField(
  field: Field,
  values: SettingsMap,
  onChange: (key: keyof SettingsMap, value: string | number | boolean) => void,
): ReactNode {
  if (field.type === "note") {
    return (
      <p key={field.text} className="text-sm text-bp-muted sm:col-span-3">
        {field.text}
      </p>
    );
  }

  if (field.type === "toggle") {
    return (
      <ToggleRow
        key={field.key}
        label={field.label}
        checked={Boolean(values[field.key])}
        onChange={(on) => onChange(field.key, on)}
      />
    );
  }

  const value = values[field.key];
  return (
    <FormField key={field.key} label={field.label} hint={field.hint}>
      {field.type === "number" ? (
        <NumberInput
          value={Number(value)}
          onChange={(e) => onChange(field.key, Number(e.target.value))}
        />
      ) : (
        <TextInput value={String(value)} onChange={(e) => onChange(field.key, e.target.value)} />
      )}
    </FormField>
  );
}
