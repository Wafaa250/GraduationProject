using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace GraduationProject.API.Hubs
{
    [Authorize]
    public class NotificationsHub : Hub
    {
    }
}
