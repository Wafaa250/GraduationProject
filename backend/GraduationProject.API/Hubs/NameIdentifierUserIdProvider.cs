using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace GraduationProject.API.Hubs
{
    /// <summary>
    /// Maps SignalR user targets to JWT <see cref="ClaimTypes.NameIdentifier"/> (Users.Id).
    /// </summary>
    public sealed class NameIdentifierUserIdProvider : IUserIdProvider
    {
        public string? GetUserId(HubConnectionContext connection) =>
            connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? connection.User?.FindFirst("sub")?.Value;
    }
}
