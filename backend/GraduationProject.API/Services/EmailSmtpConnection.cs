using MailKit.Security;

namespace GraduationProject.API.Services
{
    internal static class EmailSmtpConnection
    {
        /// <summary>
        /// Brevo and most providers: port 587 → STARTTLS; port 465 → SSL on connect.
        /// </summary>
        public static SecureSocketOptions ResolveSecureSocketOptions(int port, bool useSsl)
        {
            if (port == 465)
                return SecureSocketOptions.SslOnConnect;

            if (port == 587 || useSsl)
                return SecureSocketOptions.StartTls;

            return SecureSocketOptions.Auto;
        }

        public static string DescribeSecureSocketOptions(int port, bool useSsl) =>
            ResolveSecureSocketOptions(port, useSsl).ToString();
    }
}
