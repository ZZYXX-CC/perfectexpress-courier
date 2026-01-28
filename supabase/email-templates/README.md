# PerfectExpress Email Templates

Custom branded email templates for Supabase Authentication emails.

## Templates Included

| Template | File | Purpose |
|----------|------|---------|
| **Confirm Signup** | `confirmation.html` | Sent when a user signs up |
| **Password Reset** | `recovery.html` | Sent when a user requests password reset |
| **Magic Link** | `magic_link.html` | Sent for passwordless login |
| **Invite User** | `invite.html` | Sent when inviting a new user |
| **Email Change** | `email_change.html` | Sent when changing email address |

## How to Apply These Templates

### Step 1: Go to Supabase Dashboard

1. Open your Supabase project: https://supabase.com/dashboard/project/jcnoftoyozkvndkqldfx
2. Navigate to **Authentication** → **Email Templates**

### Step 2: Update Each Template

For each template type:

1. Click on the template tab (e.g., "Confirm signup")
2. Copy the HTML content from the corresponding file in this folder
3. Paste it into the **Message body** field
4. Update the **Subject** field with a branded subject line:

| Template | Suggested Subject Line |
|----------|----------------------|
| Confirm signup | `Welcome to PerfectExpress - Confirm Your Email` |
| Invite user | `You're Invited to Join PerfectExpress` |
| Magic link | `Your PerfectExpress Login Link` |
| Change email | `Confirm Your New Email - PerfectExpress` |
| Reset password | `Reset Your PerfectExpress Password` |

5. Click **Save** after updating each template

### Step 3: Test the Templates

1. Sign up with a test email to verify the confirmation email
2. Request a password reset to verify the recovery email
3. Try changing your email in the profile settings

## Template Variables

These templates use Supabase's built-in variables:

- `{{ .ConfirmationURL }}` - The action link
- `{{ .Email }}` - User's email address
- `{{ .NewEmail }}` - New email (for email change only)
- `{{ .SiteURL }}` - Your app's URL

## Brand Colors

The templates use PerfectExpress brand colors:
- Primary Orange: `#f97316`
- Secondary Orange: `#ea580c`
- Background: `#f8fafc`
- Text Dark: `#0f172a`
- Text Gray: `#475569`
