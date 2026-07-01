using Furion.FriendlyException;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Gentle.Application.Apps;

/// <summary>
/// 文件上传应用服务
/// </summary>
/// <remarks>
/// 提供合同图片等文件上传，存储到本地 wwwroot 并返回可访问的 URL。
/// </remarks>
[ApiDescriptionSettings("File", Name = "FileApp", Order = 5)]
[Route("api/file")]
[Authorize]
public class FileAppService : IDynamicApiController
{
    private readonly IWebHostEnvironment _env;

    public FileAppService(IWebHostEnvironment env)
    {
        _env = env;
    }

    /// <summary>
    /// 上传文件（合同图片等），返回可访问的 URL。
    /// </summary>
    /// <param name="file">单文件，仅图片，≤10MB</param>
    /// <returns>包含 url 的对象</returns>
    [HttpPost("upload")]
    public async Task<object> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            throw Oops.Oh("请选择要上传的文件");
        }

        // 大小限制 10MB
        if (file.Length > 10 * 1024 * 1024)
        {
            throw Oops.Oh("文件大小不能超过 10MB");
        }

        // 类型限制：仅图片
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType))
        {
            throw Oops.Oh("仅支持 jpg/png/gif/webp 格式");
        }

        // 扩展名白名单校验（防止 svg/html 等可执行内容绕过 content-type 伪造）
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        if (!allowedExtensions.Contains(ext))
        {
            throw Oops.Oh("仅支持 jpg/jpeg/png/gif/webp 格式");
        }

        // 存储路径：{ContentRootPath}/wwwroot/uploads/contracts/{yyyyMMdd}/{guid}{ext}
        var dateDir = DateTime.Now.ToString("yyyyMMdd");
        var absDir = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads", "contracts", dateDir);
        Directory.CreateDirectory(absDir);

        var fileName = $"{Guid.NewGuid():N}{ext}";
        var absPath = Path.Combine(absDir, fileName);

        await using var stream = new FileStream(absPath, FileMode.Create);
        await file.CopyToAsync(stream);

        var url = $"/uploads/contracts/{dateDir}/{fileName}";
        return new { url };
    }
}
