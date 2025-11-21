using Microsoft.AspNetCore.StaticFiles;

namespace debug_video
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            builder.Services.AddRazorPages();

            var app = builder.Build();

            // Create a custom MIME type provider
            var provider = new FileExtensionContentTypeProvider();
            provider.Mappings[".m3u8"] = "application/x-mpegURL";
            provider.Mappings[".ts"] = "video/mp2t";
            provider.Mappings[".mpd"] = "application/dash+xml";
            provider.Mappings[".m4s"] = "video/iso.segment";
            provider.Mappings[".flac"] = "audio/flac";
            provider.Mappings[".m4a"] = "audio/mp4";
            provider.Mappings[".mp4"] = "video/mp4";

            app.UseStaticFiles(new StaticFileOptions
            {
                ContentTypeProvider = provider
            });

            // Configure the HTTP request pipeline.
            if (!app.Environment.IsDevelopment())
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();

            app.UseRouting();

            app.UseAuthorization();

            app.MapRazorPages();

            app.Run();
        }
    }
}
