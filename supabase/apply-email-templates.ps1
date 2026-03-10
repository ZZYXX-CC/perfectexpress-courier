param(
  [Parameter(Mandatory=$true)][string]$ProjectRef,
  [Parameter(Mandatory=$true)][string]$AccessToken,
  [string]$SenderName = 'PerfectExpress Courier'
)

$base = Split-Path -Parent $MyInvocation.MyCommand.Path
$tplDir = Join-Path $base 'email-templates'

function Read-Template([string]$name){
  $p = Join-Path $tplDir $name
  if(Test-Path $p){ return Get-Content $p -Raw }
  return $null
}

$body = @{
  smtp_sender_name = $SenderName

  mailer_templates_confirmation_content = (Read-Template 'confirmation.html')
  mailer_templates_email_change_content = (Read-Template 'email-change.html')
  mailer_templates_invite_content = (Read-Template 'invite.html')
  mailer_templates_magic_link_content = (Read-Template 'magic-link.html')
  mailer_templates_reauthentication_content = (Read-Template 'reauthentication.html')
  mailer_templates_recovery_content = (Read-Template 'recovery.html')

  mailer_templates_password_changed_notification_content = (Read-Template 'password-changed-notification.html')
  mailer_templates_email_changed_notification_content = (Read-Template 'email-changed-notification.html')
  mailer_templates_phone_changed_notification_content = (Read-Template 'phone-changed-notification.html')
  mailer_templates_mfa_factor_enrolled_notification_content = (Read-Template 'mfa-factor-enrolled-notification.html')
  mailer_templates_mfa_factor_unenrolled_notification_content = (Read-Template 'mfa-factor-unenrolled-notification.html')
  mailer_templates_identity_linked_notification_content = (Read-Template 'identity-linked-notification.html')
  mailer_templates_identity_unlinked_notification_content = (Read-Template 'identity-unlinked-notification.html')
}

$headers = @{
  Authorization = "Bearer $AccessToken"
  'Content-Type' = 'application/json'
}

$json = $body | ConvertTo-Json -Depth 12

Invoke-RestMethod -Method Patch -Uri "https://api.supabase.com/v1/projects/$ProjectRef/config/auth" -Headers $headers -Body $json
Write-Host "Updated templates + sender name for $ProjectRef"
