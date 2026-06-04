using System;
using System.Net;

namespace GraduationProject.API.Services.Email
{
    internal static class SkillSwapEmailTemplates
    {
        private const string BrandName = "SkillSwap";
        private const string BrandColor = "#4f46e5";
        private const string TextColor = "#1e293b";
        private const string MutedColor = "#64748b";
        private const string BorderColor = "#e2e8f0";
        private const string SurfaceColor = "#f8fafc";

        public static string SubjectWelcome => $"{BrandName} | Welcome to your workspace";
        public static string SubjectPasswordResetOtp => $"{BrandName} | Your account security code";
        public static string SubjectAccountInvitation => $"{BrandName} | Account invitation";

        public static (string Html, string PlainText) BuildWelcomeEmail(WelcomeEmailContent content)
        {
            var safeName = Encode(content.RecipientName);
            var safeCompany = Encode(content.CompanyName);
            var safeEmail = Encode(content.LoginEmail);
            var safeSignInValue = Encode(content.SignInValue);
            var safeSupportEmail = Encode(content.SupportEmail);
            var year = DateTime.UtcNow.Year;

            var htmlBody = $"""
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:{TextColor};">
                  Hi {safeName},
                </p>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:{TextColor};">
                  You have been invited to join the <strong>{safeCompany}</strong> workspace on {BrandName}.
                  Use the details below to sign in for the first time.
                </p>
                {InfoBox($"""
                  <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:{MutedColor};">
                    <strong style="color:{TextColor};">Why you received this email</strong><br />
                    An administrator added your account to the {safeCompany} workspace. This message contains your initial sign-in details.
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0;">
                    <tr>
                      <td style="padding:8px 0;font-size:14px;color:{MutedColor};width:120px;vertical-align:top;">Organization</td>
                      <td style="padding:8px 0;font-size:14px;color:{TextColor};font-weight:600;">{safeCompany}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;font-size:14px;color:{MutedColor};vertical-align:top;">Sign-in email</td>
                      <td style="padding:8px 0;font-size:14px;color:{TextColor};">{safeEmail}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;font-size:14px;color:{MutedColor};vertical-align:top;">Initial sign-in</td>
                      <td style="padding:8px 0;font-size:14px;color:{TextColor};font-family:Consolas,'Courier New',monospace;letter-spacing:0.02em;">{safeSignInValue}</td>
                    </tr>
                  </table>
                  """)}
                {PrimaryButton("Open SkillSwap", content.LoginUrl)}
                <p style="margin:20px 0 16px;font-size:15px;line-height:1.6;color:{TextColor};">
                  After your first sign-in, you will be asked to choose a new personal sign-in code for your account.
                </p>
                {SecurityNote("If you were not expecting access to this workspace, contact your organization administrator. Do not share your credentials with anyone, including SkillSwap Support.")}
                """;

            var plainText = $"""
                Hi {content.RecipientName},

                You have been invited to join the {content.CompanyName} workspace on {BrandName}.

                Why you received this email:
                An administrator added your account to the {content.CompanyName} workspace.

                Organization: {content.CompanyName}
                Sign-in email: {content.LoginEmail}
                Initial sign-in: {content.SignInValue}

                Open SkillSwap: {content.LoginUrl}

                After your first sign-in, you will be asked to choose a new personal sign-in code.

                Security: If you were not expecting this invitation, contact your organization administrator. Do not share your credentials.

                {BuildPlainTextFooter(year, content.SupportEmail)}
                """;

            return (WrapLayout(SubjectWelcome, htmlBody, safeSupportEmail, year), plainText.Trim());
        }

        public static (string Html, string PlainText) BuildPasswordResetOtpEmail(PasswordResetOtpEmailContent content)
        {
            var safeSupportEmail = Encode(content.SupportEmail);
            var year = DateTime.UtcNow.Year;
            var preheader =
                $"Your {BrandName} security code is included below. It expires in {content.ExpirationMinutes} minutes.";

            var htmlBody = $"""
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:{TextColor};">
                  Hello,
                </p>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:{TextColor};">
                  We received a request to update the sign-in credentials for your {BrandName} account.
                </p>
                <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:{TextColor};">
                  Enter this one-time security code in the app:
                </p>
                {OtpCodeDisplay(content.VerificationCode)}
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:{TextColor};">
                  This code is valid for {content.ExpirationMinutes} minutes.
                </p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:{MutedColor};">
                  If you did not make this request, you can ignore this message. Your account will stay unchanged.
                </p>
                <p style="margin:0;font-size:15px;line-height:1.6;color:{TextColor};">
                  {BrandName} Support
                </p>
                """;

            var plainText = $"""
                Hello,

                We received a request to update the sign-in credentials for your {BrandName} account.

                Enter this one-time security code in the app:

                {content.VerificationCode}

                This code is valid for {content.ExpirationMinutes} minutes.

                If you did not make this request, you can ignore this message. Your account will stay unchanged.

                {BrandName} Support

                {BuildPlainTextFooter(year, content.SupportEmail)}
                """;

            return (WrapLayout(preheader, htmlBody, safeSupportEmail, year), plainText.Trim());
        }

        private static string OtpCodeDisplay(string code)
        {
            var safeCode = Encode(code);
            return $"""
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
                  <tr>
                    <td align="center" style="padding:18px 24px;background-color:{SurfaceColor};border:1px solid {BorderColor};border-radius:8px;">
                      <span style="font-size:28px;font-weight:700;letter-spacing:0.25em;color:{TextColor};font-family:Consolas,'Courier New',monospace;">
                        {safeCode}
                      </span>
                    </td>
                  </tr>
                </table>
                """;
        }

        private static string WrapLayout(string preheader, string innerHtml, string safeSupportEmail, int year)
        {
            var safePreheader = Encode(preheader);
            return $"""
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="utf-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                  <title>{Encode(BrandName)}</title>
                </head>
                <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
                    {safePreheader}
                  </div>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f1f5f9;padding:32px 16px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;">
                          <tr>
                            <td style="padding:0 0 20px;text-align:center;">
                              <p style="margin:0;font-size:24px;font-weight:700;color:{BrandColor};letter-spacing:-0.02em;">
                                {BrandName}
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="background-color:#ffffff;border-radius:8px;border:1px solid {BorderColor};padding:28px 24px;">
                              {innerHtml}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:24px 8px 0;text-align:center;">
                              {HtmlFooter(year, safeSupportEmail)}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """;
        }

        private static string HtmlFooter(int year, string safeSupportEmail) =>
            $"""
            <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:{MutedColor};">
              © {year} {BrandName}. All rights reserved.
            </p>
            <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:{MutedColor};">
              Need help? Contact
              <a href="mailto:{safeSupportEmail}" style="color:{BrandColor};text-decoration:none;">{safeSupportEmail}</a>
            </p>
            <p style="margin:0;font-size:11px;line-height:1.5;color:#94a3b8;">
              This is an automated message from {BrandName} Support. Replies are monitored at the address above.
            </p>
            """;

        private static string BuildPlainTextFooter(int year, string supportEmail) =>
            $"""
            --
            {BrandName}
            © {year} {BrandName}. All rights reserved.
            Support: {supportEmail}
            """;

        private static string PrimaryButton(string label, string href)
        {
            var safeHref = Encode(href);
            var safeLabel = Encode(label);
            return $"""
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 4px;">
                  <tr>
                    <td align="center">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="border-radius:8px;background-color:{BrandColor};">
                            <a href="{safeHref}" target="_blank" rel="noopener noreferrer"
                               style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                              {safeLabel}
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                """;
        }

        private static string InfoBox(string innerHtml) =>
            $"""
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;background-color:{SurfaceColor};border:1px solid {BorderColor};border-radius:8px;">
              <tr>
                <td style="padding:16px 18px;">
                  {innerHtml}
                </td>
              </tr>
            </table>
            """;

        private static string SecurityNote(string text) =>
            $"""
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 0;border-left:3px solid {BrandColor};background-color:{SurfaceColor};border-radius:0 8px 8px 0;">
              <tr>
                <td style="padding:14px 16px;">
                  <p style="margin:0 0 6px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:{MutedColor};">
                    Security
                  </p>
                  <p style="margin:0;font-size:13px;line-height:1.55;color:{TextColor};">
                    {Encode(text)}
                  </p>
                </td>
              </tr>
            </table>
            """;

        private static string Encode(string? value) =>
            WebUtility.HtmlEncode(value ?? string.Empty);

        internal sealed class WelcomeEmailContent
        {
            public string RecipientName { get; init; } = string.Empty;
            public string CompanyName { get; init; } = string.Empty;
            public string LoginEmail { get; init; } = string.Empty;
            public string SignInValue { get; init; } = string.Empty;
            public string LoginUrl { get; init; } = string.Empty;
            public string SupportEmail { get; init; } = string.Empty;
        }

        internal sealed class PasswordResetOtpEmailContent
        {
            public string VerificationCode { get; init; } = string.Empty;
            public int ExpirationMinutes { get; init; }
            public string SupportEmail { get; init; } = string.Empty;
        }
    }
}
