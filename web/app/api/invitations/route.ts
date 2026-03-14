/**
 * POST /api/invitations
 *
 * Creates an invitation record and sends an invitation email to the recipient.
 *
 * Email delivery uses the Resend API (https://resend.com).
 * Set RESEND_API_KEY in your .env.local to enable real email sending.
 * Without it, the invitation record is still created but no email is sent.
 *
 * Request body:
 *   { email: string; role: UserRole; companyId: string }
 *
 * Authentication: must be company_admin or super_admin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createInvitation } from '@/lib/services/users.service';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const FROM_EMAIL = process.env.INVITATION_FROM_EMAIL ?? 'noreply@sitewatch.app';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Role check — only admins can invite
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || !['company_admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Parse body
  let email: string;
  let role: string;

  try {
    const body = await req.json();
    email = body.email?.trim().toLowerCase();
    role = body.role;

    if (!email || !role) {
      return NextResponse.json({ error: 'email and role are required' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Create invitation record in DB
  let invitation;
  try {
    invitation = await createInvitation(profile.company_id, user.id, email, role as any);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Failed to create invitation' }, { status: 500 });
  }

  // Get company name for the email
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', profile.company_id)
    .single();

  const companyName = company?.name ?? 'your team';
  const inviterName = profile.full_name ?? user.email ?? 'A team admin';
  const acceptUrl = `${APP_URL}/register?invite=${invitation.id}`;
  const expiresAt = new Date(invitation.expires_at).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  // Send email via Resend if API key is configured
  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `SiteWatch <${FROM_EMAIL}>`,
          to: [email],
          subject: `You've been invited to join ${companyName} on SiteWatch`,
          html: buildInviteEmail({
            inviterName,
            companyName,
            role,
            acceptUrl,
            expiresAt,
          }),
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error('[invitations] Resend error:', errBody);
        // Don't fail the request — invitation record was created successfully
      }
    } catch (err) {
      console.error('[invitations] Email send failed:', err);
    }
  } else {
    console.log(
      `[invitations] RESEND_API_KEY not set. Invitation created for ${email} (ID: ${invitation.id}). Accept URL: ${acceptUrl}`
    );
  }

  return NextResponse.json({ invitation }, { status: 201 });
}

// ── Email template ─────────────────────────────────────────────────────────────

function buildInviteEmail({
  inviterName,
  companyName,
  role,
  acceptUrl,
  expiresAt,
}: {
  inviterName: string;
  companyName: string;
  role: string;
  acceptUrl: string;
  expiresAt: string;
}) {
  const roleLabel: Record<string, string> = {
    worker: 'Field Worker',
    supervisor: 'Supervisor',
    company_admin: 'Company Admin',
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>You're invited to SiteWatch</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

          <!-- Header -->
          <tr>
            <td style="background:#1d4ed8;padding:28px 32px;">
              <p style="margin:0;color:#fff;font-size:22px;font-weight:700;">🦺 SiteWatch</p>
              <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Safety & Incident Reporting</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 8px;font-size:20px;color:#111827;">You've been invited!</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                <strong style="color:#111827;">${inviterName}</strong> has invited you to join
                <strong style="color:#111827;">${companyName}</strong> on SiteWatch as a
                <strong style="color:#111827;">${roleLabel[role] ?? role}</strong>.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:#2563eb;border-radius:8px;">
                    <a href="${acceptUrl}"
                       style="display:inline-block;padding:14px 28px;color:#fff;font-size:15px;font-weight:600;text-decoration:none;">
                      Accept Invitation →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">
                Or copy this link into your browser:
              </p>
              <p style="margin:0 0 24px;font-size:12px;color:#6b7280;word-break:break-all;">
                ${acceptUrl}
              </p>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;"/>

              <p style="margin:0;font-size:13px;color:#9ca3af;">
                This invitation expires on <strong>${expiresAt}</strong>. If you weren't expecting this,
                you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                SiteWatch · Safety & Incident Reporting Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
