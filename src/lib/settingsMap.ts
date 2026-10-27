import type { AdminSettingsDto } from "@/lib/api";
import type { SettingsMap } from "@/types/models";

export function settingsFromApi(s: AdminSettingsDto): SettingsMap {
  return {
    otpLength: s.otp_length,
    otpExpiry: s.otp_expiry,
    otpAttempts: s.otp_attempts,
    otpGap: s.otp_gap,
    otpPerPhoneHourly: s.otp_per_phone_hourly,
    otpPerIpHourly: s.otp_per_ip_hourly,
    ringTimeout: s.ring_timeout,
    maxGroupCallParticipants: s.max_group_call_participants,
    maxGroupSize: s.max_group_size,
    uploadLimitMb: s.upload_limit_mb,
    editWindowMinutes: s.edit_window_minutes,
    maintenanceMode: s.maintenance_mode,
    latestAndroidVersion: s.latest_android_version,
    latestAndroidVersionCode: s.latest_android_version_code,
    minAndroidVersionCode: s.min_android_version_code,
    downloadUrl: s.download_url,
    allowPeopleSearch: s.allow_people_search,
    minSearchChars: s.min_search_chars,
    smsEnabled: s.sms_enabled,
  };
}

export function settingsToApi(s: SettingsMap): AdminSettingsDto {
  return {
    otp_length: s.otpLength,
    otp_expiry: s.otpExpiry,
    otp_attempts: s.otpAttempts,
    otp_gap: s.otpGap,
    otp_per_phone_hourly: s.otpPerPhoneHourly,
    otp_per_ip_hourly: s.otpPerIpHourly,
    ring_timeout: s.ringTimeout,
    max_group_call_participants: s.maxGroupCallParticipants,
    max_group_size: s.maxGroupSize,
    upload_limit_mb: s.uploadLimitMb,
    edit_window_minutes: s.editWindowMinutes,
    maintenance_mode: s.maintenanceMode,
    latest_android_version: s.latestAndroidVersion,
    latest_android_version_code: s.latestAndroidVersionCode,
    min_android_version_code: s.minAndroidVersionCode,
    download_url: s.downloadUrl,
    allow_people_search: s.allowPeopleSearch,
    min_search_chars: s.minSearchChars,
    sms_enabled: s.smsEnabled,
  };
}
