// The home page's HD video files, from the finalv100 HD masters, with macOS's own encoder
// (AVFoundation / VideoToolbox), so no ffmpeg is needed:
//
//   swiftc -O -swift-version 5 web-encode.swift -o /tmp/web-encode
//   /tmp/web-encode encode sbozhme_pan-dude-desktop-finalv100-hd.mp4 ../../apps/web/public/videos/home/pan-dude-desktop-hd.mp4 4.5
//   /tmp/web-encode encode sbozhme_pan-dude-reels-finalv100-hd.mp4   ../../apps/web/public/videos/home/pan-dude-mobile-hd.mp4  4.5
//   /tmp/web-encode frame  some.mp4 20 still.png      (a still, to compare against the master)
//
// H.264 High at the given average Mbps, a keyframe every 2s, the AAC audio copied as it is,
// and the index first so playback starts before the download ends. The site picks HD only
// when the network does twice this bitrate (apps/web/components/home/video-quality.ts).

import AVFoundation
import Foundation
import ImageIO
import UniformTypeIdentifiers

func fail(_ message: String) -> Never {
    FileHandle.standardError.write((message + "\n").data(using: .utf8)!)
    exit(1)
}

func encode(input: URL, output: URL, mbps: Double) {
    try? FileManager.default.removeItem(at: output)
    let asset = AVURLAsset(url: input)
    guard let videoTrack = asset.tracks(withMediaType: .video).first else { fail("no video track in \(input.path)") }
    let audioTrack = asset.tracks(withMediaType: .audio).first
    let size = videoTrack.naturalSize
    let fps = videoTrack.nominalFrameRate > 0 ? videoTrack.nominalFrameRate : 30

    let reader: AVAssetReader
    let writer: AVAssetWriter
    do {
        reader = try AVAssetReader(asset: asset)
        writer = try AVAssetWriter(outputURL: output, fileType: .mp4)
    } catch {
        fail("can't open: \(error)")
    }
    writer.shouldOptimizeForNetworkUse = true

    let videoOut = AVAssetReaderTrackOutput(
        track: videoTrack,
        outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange]
    )
    videoOut.alwaysCopiesSampleData = false
    reader.add(videoOut)

    let videoIn = AVAssetWriterInput(mediaType: .video, outputSettings: [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: Int(size.width),
        AVVideoHeightKey: Int(size.height),
        AVVideoCompressionPropertiesKey: [
            AVVideoAverageBitRateKey: Int(mbps * 1_000_000),
            AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
            AVVideoH264EntropyModeKey: AVVideoH264EntropyModeCABAC,
            AVVideoMaxKeyFrameIntervalKey: Int((fps * 2).rounded()),
            AVVideoExpectedSourceFrameRateKey: Int(fps.rounded()),
            AVVideoAllowFrameReorderingKey: true,
        ],
    ])
    videoIn.transform = videoTrack.preferredTransform
    videoIn.expectsMediaDataInRealTime = false
    writer.add(videoIn)

    var audioPair: (AVAssetWriterInput, AVAssetReaderTrackOutput)?
    if let audioTrack {
        let audioOut = AVAssetReaderTrackOutput(track: audioTrack, outputSettings: nil)
        reader.add(audioOut)
        let hint = audioTrack.formatDescriptions.first.map { $0 as! CMFormatDescription }
        let audioIn = AVAssetWriterInput(mediaType: .audio, outputSettings: nil, sourceFormatHint: hint)
        audioIn.expectsMediaDataInRealTime = false
        writer.add(audioIn)
        audioPair = (audioIn, audioOut)
    }

    guard reader.startReading() else { fail("reader: \(String(describing: reader.error))") }
    guard writer.startWriting() else { fail("writer: \(String(describing: writer.error))") }
    writer.startSession(atSourceTime: .zero)

    let group = DispatchGroup()
    func pump(_ input: AVAssetWriterInput, _ output: AVAssetReaderTrackOutput, _ label: String) {
        group.enter()
        var finished = false
        input.requestMediaDataWhenReady(on: DispatchQueue(label: label)) {
            while input.isReadyForMoreMediaData && !finished {
                if let sample = output.copyNextSampleBuffer() {
                    if !input.append(sample) {
                        fail("\(label): \(String(describing: writer.error))")
                    }
                } else {
                    finished = true
                    input.markAsFinished()
                    group.leave()
                }
            }
        }
    }
    pump(videoIn, videoOut, "video")
    if let (audioIn, audioOut) = audioPair { pump(audioIn, audioOut, "audio") }
    group.wait()

    if reader.status == .failed { fail("reader: \(String(describing: reader.error))") }
    let done = DispatchSemaphore(value: 0)
    writer.finishWriting { done.signal() }
    done.wait()
    if writer.status != .completed { fail("writer: \(String(describing: writer.error))") }
    print("\(output.path): \(Int(size.width))x\(Int(size.height)) at \(mbps) Mbps")
}

func frame(input: URL, seconds: Double, output: URL) {
    let generator = AVAssetImageGenerator(asset: AVURLAsset(url: input))
    generator.appliesPreferredTrackTransform = true
    generator.requestedTimeToleranceBefore = .zero
    generator.requestedTimeToleranceAfter = .zero
    let image: CGImage
    do {
        image = try generator.copyCGImage(at: CMTime(seconds: seconds, preferredTimescale: 600), actualTime: nil)
    } catch {
        fail("frame: \(error)")
    }
    guard let destination = CGImageDestinationCreateWithURL(output as CFURL, UTType.png.identifier as CFString, 1, nil) else {
        fail("can't write \(output.path)")
    }
    CGImageDestinationAddImage(destination, image, nil)
    if !CGImageDestinationFinalize(destination) { fail("can't write \(output.path)") }
    print(output.path)
}

let args = CommandLine.arguments
switch args.count > 1 ? args[1] : "" {
case "encode" where args.count == 5:
    guard let mbps = Double(args[4]) else { fail("bitrate must be a number of Mbps") }
    encode(input: URL(fileURLWithPath: args[2]), output: URL(fileURLWithPath: args[3]), mbps: mbps)
case "frame" where args.count == 5:
    guard let seconds = Double(args[3]) else { fail("seconds must be a number") }
    frame(input: URL(fileURLWithPath: args[2]), seconds: seconds, output: URL(fileURLWithPath: args[4]))
default:
    fail("usage: web-encode encode in.mp4 out.mp4 mbps | web-encode frame in.mp4 seconds out.png")
}
