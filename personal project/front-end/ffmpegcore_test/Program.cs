using FFMpegCore;
using FFMpegCore.Pipes;
using System.Diagnostics;

namespace ffmpegcore_test
{
    internal class Program
    {
        static void Main(string[] args)
        {
            Stopwatch stopwatch = new Stopwatch();

            Encode_video(stopwatch, false, false, false, false);

            Encode_Song(stopwatch, true, true);
        }

        private static void Encode_video(Stopwatch stopwatch, bool HLS_CPU = true, bool GLS_GPU = true, bool DASH_CPU = true, bool DASH_GPU = true)
        {
            string inputPath = "F:\\Fontys\\ffmpegcore_test\\ffmpegcore test\\Video\\who.mp4";
            
            // HLS CPU
            if (HLS_CPU)
            {
                string outputDir = "F:\\Fontys\\ffmpegcore_test\\ffmpegcore test\\Video\\hls";
                Directory.CreateDirectory(outputDir);

                stopwatch.Start();

                FFMpegArguments
                    .FromFileInput(inputPath)
                    .OutputToFile($"{outputDir}/playlist.m3u8", overwrite: true, options => options
                    .WithCustomArgument("-map 0:a:0")
                    .WithCustomArgument("-map 0:v:0")
                    .WithCustomArgument("-c:v libx264")
                    .WithCustomArgument("-c:a aac")
                    .WithCustomArgument("-q:a 2")
                    .WithCustomArgument("-ac 2")
                    .WithCustomArgument("-hls_segment_type mpegts")
                    .WithCustomArgument("-start_number 0")
                    .WithCustomArgument("-hls_time 10")
                    .WithCustomArgument("-hls_list_size 0")
                    .WithCustomArgument("-f hls"))
                    .ProcessSynchronously();

                stopwatch.Stop();
                Console.WriteLine($"HLS CPU Video encoding took: {stopwatch.Elapsed.Minutes}m {stopwatch.Elapsed.Seconds}s");
                stopwatch.Reset();
            }

            // HLS GPU
            if (GLS_GPU)
            {
                string outputDir = "F:\\Fontys\\ffmpegcore_test\\ffmpegcore test\\Video\\hls_GPU";
                Directory.CreateDirectory(outputDir);

                stopwatch.Start();

                FFMpegArguments
                    .FromFileInput(inputPath)
                    .OutputToFile($"{outputDir}/playlist.m3u8", overwrite: true, options => options
                    .WithCustomArgument("-map 0:a:0")
                    .WithCustomArgument("-map 0:v:0")
                    .WithCustomArgument("-c:v h264_amf")
                    .WithCustomArgument("-c:a aac")
                    .WithCustomArgument("-q:a 2")
                    .WithCustomArgument("-ac 2")
                    .WithCustomArgument("-hls_segment_type mpegts")
                    .WithCustomArgument("-start_number 0")
                    .WithCustomArgument("-hls_time 10")
                    .WithCustomArgument("-hls_list_size 0")
                    .WithCustomArgument("-f hls"))
                    .ProcessSynchronously();

                stopwatch.Stop();
                Console.WriteLine($"HLS GPU Video encoding took: {stopwatch.Elapsed.Minutes}m {stopwatch.Elapsed.Seconds}s");
                stopwatch.Reset();
            }


            // DASH CPU
            if (DASH_CPU)
            {
                string outputDir = "F:\\Fontys\\ffmpegcore_test\\ffmpegcore test\\Video\\dash";
                Directory.CreateDirectory(outputDir);

                stopwatch.Start();

                FFMpegArguments
                    .FromFileInput(inputPath)
                    .OutputToFile($"{outputDir}/manifest.mpd", overwrite: true, options => options
                    .WithCustomArgument("-map 0:a:0")
                    .WithCustomArgument("-map 0:v:0")
                    .WithCustomArgument("-c:v libx264")
                    .WithCustomArgument("-c:a aac")
                    .WithCustomArgument("-q:a 2")
                    .WithCustomArgument("-ac 2")
                    .WithCustomArgument("-seg_duration 10")
                    .WithCustomArgument("-use_template 1")
                    .WithCustomArgument("-use_timeline 1")
                    .WithCustomArgument("-f dash"))
                    .ProcessSynchronously();

                stopwatch.Stop();
                Console.WriteLine($"DASH CPU Video encoding took: {stopwatch.Elapsed.Minutes}m {stopwatch.Elapsed.Seconds}s");
                stopwatch.Reset();
            }


            // DASH GPU
            if (DASH_GPU)
            {
                string outputDir = "F:\\Fontys\\ffmpegcore_test\\ffmpegcore test\\Video\\dash_GPU";
                Directory.CreateDirectory(outputDir);

                stopwatch.Start();

                FFMpegArguments
                    .FromFileInput(inputPath)
                    .OutputToFile($"{outputDir}/manifest.mpd", overwrite: true, options => options
                    .WithCustomArgument("-map 0:a:0")
                    .WithCustomArgument("-map 0:v:0")
                    .WithCustomArgument("-c:v h264_amf")
                    .WithCustomArgument("-c:a aac")
                    .WithCustomArgument("-q:a 2")
                    .WithCustomArgument("-ac 2")
                    .WithCustomArgument("-seg_duration 10")
                    .WithCustomArgument("-use_template 1")
                    .WithCustomArgument("-use_timeline 1")
                    .WithCustomArgument("-f dash"))
                    .ProcessSynchronously();

                stopwatch.Stop();
                Console.WriteLine($"DASH GPU Video encoding took: {stopwatch.Elapsed.Minutes}m {stopwatch.Elapsed.Seconds}s");
                stopwatch.Reset();
            }
        }

        private static void Encode_Song(Stopwatch stopwatch, bool HLS_CPU = true, bool DASH_CPU = true)
        {
            string inputPath = "F:\\Fontys\\ffmpegcore_test\\ffmpegcore test\\Audio\\Golden.flac";

            // HLS CPU
            if (HLS_CPU)
            {
                string outputDir = "F:\\Fontys\\ffmpegcore_test\\ffmpegcore test\\Audio\\hls";
                Directory.CreateDirectory(outputDir);

                stopwatch.Start();

                FFMpegArguments
                    .FromFileInput(inputPath)
                    .OutputToFile($"{outputDir}/playlist.m3u8", overwrite: true, options => options
                    .WithCustomArgument("-map 0:a:0 -map 0:a:0 -map 0:a:0")
                    .WithCustomArgument("-c:a aac")
                    .WithCustomArgument("-b:a:0 96k -b:a:1 192k -b:a:2 320k")
                    .WithCustomArgument("-q:a 2")
                    .WithCustomArgument("-ac 2")
                    .WithCustomArgument("-vn")
                    .WithCustomArgument("-hls_segment_type mpegts")
                    .WithCustomArgument("-start_number 0")
                    .WithCustomArgument("-hls_time 10")
                    .WithCustomArgument("-hls_list_size 0")
                    .WithCustomArgument("-f hls"))
                    .ProcessSynchronously();

                stopwatch.Stop();
                Console.WriteLine($"HLS CPU audio encoding took: {stopwatch.Elapsed.Minutes}m {stopwatch.Elapsed.Seconds}s");
                stopwatch.Reset();
            }

            // DASH CPU
            if (DASH_CPU)
            {
                string outputDir = "F:\\Fontys\\ffmpegcore_test\\ffmpegcore test\\Audio\\dash";
                Directory.CreateDirectory(outputDir);

                stopwatch.Start();

                FFMpegArguments
                    .FromFileInput(inputPath)
                    .OutputToFile($"{outputDir}/manifest.mpd", overwrite: true, options => options
                    .WithCustomArgument("-map 0:a:0 -map 0:a:0 -map 0:a:0")
                    .WithCustomArgument("-c:a aac")
                    .WithCustomArgument("-b:a:0 96k -b:a:1 192k -b:a:2 320k")
                    .WithCustomArgument("-ac 2")
                    .WithCustomArgument("-vn")
                    .WithCustomArgument("-seg_duration 10")
                    .WithCustomArgument("-use_template 1")
                    .WithCustomArgument("-use_timeline 1")
                    .WithCustomArgument("-f dash"))
                    .ProcessSynchronously();

                stopwatch.Stop();
                Console.WriteLine($"DASH CPU audio encoding took: {stopwatch.Elapsed.Minutes}m {stopwatch.Elapsed.Seconds}s");
                stopwatch.Reset();
            }

        }

    }
}
