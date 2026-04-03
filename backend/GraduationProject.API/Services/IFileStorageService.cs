// Services/IFileStorageService.cs
namespace GraduationProject.API.Services
{
    /// <summary>
    /// Abstract file storage contract.
    /// Swap implementations without touching any controller.
    /// </summary>
    public interface IFileStorageService
    {
        /// <summary>
        /// Save a file and return its stored path / URL.
        /// </summary>
        /// <param name="base64Content">Raw base64 string (no data-URI prefix)</param>
        /// <param name="fileName">Original filename including extension</param>
        /// <param name="folder">Logical folder, e.g. "projects"</param>
        /// <returns>Relative path or absolute URL depending on implementation</returns>
        Task<string> SaveAsync(string base64Content, string fileName, string folder = "uploads");

        /// <summary>
        /// Delete a previously stored file.
        /// </summary>
        /// <param name="filePath">Path / URL returned by SaveAsync</param>
        Task DeleteAsync(string filePath);

        /// <summary>
        /// Returns a publicly accessible URL for the stored file.
        /// For local storage this is a relative URL; for cloud it's the CDN URL.
        /// </summary>
        string GetUrl(string filePath);
    }
}
