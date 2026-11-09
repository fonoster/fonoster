// Draws the dropdown as one PNG card, for "Save as image".
//
//   python3 -I menu.py --card | card OUT.png
//
// Input lines from menu.py --card: "\u{1D}ROLE\tTEXT" (text in a role), "| image=<base64 PNG> width=W
// height=H" (logo, sparkline) and "---" (a section break). Anything else is ignored. The card is the
// dropdown frame in designs/widget.nib (fill $bg, radius 14, padding 18/20, width 420, 1px $line
// border) with the fonts and colors of the menu. Exits 1 when there is nothing to draw or the file
// can't be written. Built by install.sh (needs swiftc from the Xcode command line tools).
import AppKit

guard CommandLine.arguments.count == 2 else {
    FileHandle.standardError.write("usage: card OUT.png\n".data(using: .utf8)!)
    exit(2)
}
let outPath = CommandLine.arguments[1]
let dark = (ProcessInfo.processInfo.environment["OS_APPEARANCE"] ?? "Dark") != "Light"

func hex(_ v: UInt32) -> NSColor {
    NSColor(srgbRed: CGFloat((v >> 16) & 0xFF) / 255, green: CGFloat((v >> 8) & 0xFF) / 255,
            blue: CGFloat(v & 0xFF) / 255, alpha: 1)
}

// Tokens from designs/widget.nib (Dark / Light).
let bg = hex(dark ? 0x181818 : 0xFFFFFF)
let lineColor = hex(dark ? 0x333333 : 0xE8E8E8)
let t1 = hex(dark ? 0xFFFFFF : 0x252525)
let t3 = hex(dark ? 0xC2C2C2 : 0x6B6B6B)
let t4 = hex(0x8D8D8D)
let accent = hex(dark ? 0x39E19E : 0x008751)
let warn = hex(dark ? 0xFBBF24 : 0xB45B00)
let error = hex(dark ? 0xFF5A52 : 0xD70015)

// The fonts menu.py asks SwiftBar for.
let mono = NSFont(name: "Menlo", size: 12) ?? NSFont.monospacedSystemFont(ofSize: 12, weight: .regular)
let helvetica = NSFont(name: "HelveticaNeue", size: 11) ?? NSFont.systemFont(ofSize: 11)
let helveticaBold = NSFont(name: "HelveticaNeue-Bold", size: 11) ?? NSFont.boldSystemFont(ofSize: 11)

let styles: [String: [NSAttributedString.Key: Any]] = [
    "main": [.font: mono, .foregroundColor: t1],
    "detail": [.font: mono, .foregroundColor: t3],
    "accent": [.font: mono, .foregroundColor: accent],
    "head": [.font: helvetica, .foregroundColor: t4],
    "title": [.font: helveticaBold, .foregroundColor: t4],
    "warn": [.font: helvetica, .foregroundColor: warn],
    "failing": [.font: mono, .foregroundColor: warn],
    "error": [.font: helveticaBold, .foregroundColor: error],
]

enum Item {
    case text(NSAttributedString, CGSize)
    case picture(NSImage, CGSize)
    case divider
}

func param(_ line: String, _ key: String) -> String? {
    for word in line.split(separator: " ") where word.hasPrefix(key + "=") {
        return String(word.dropFirst(key.count + 1))
    }
    return nil
}

var items: [Item] = []
while let line = readLine(strippingNewline: true) {
    if line == "---" {
        if !items.isEmpty, case .divider? = items.last {} else if !items.isEmpty { items.append(.divider) }
    } else if line.hasPrefix("\u{1D}"), let tab = line.firstIndex(of: "\t") {
        let role = String(line[line.index(after: line.startIndex)..<tab])
        let str = NSAttributedString(string: String(line[line.index(after: tab)...]), attributes: styles[role] ?? styles["detail"]!)
        let size = str.size()
        items.append(.text(str, CGSize(width: ceil(size.width), height: ceil(size.height))))
    } else if line.hasPrefix("| "), let b64 = param(line, "image"), let data = Data(base64Encoded: b64),
              let img = NSImage(data: data) {
        let w = param(line, "width").flatMap(Double.init).map { CGFloat($0) } ?? img.size.width
        let h = param(line, "height").flatMap(Double.init).map { CGFloat($0) } ?? img.size.height
        items.append(.picture(img, CGSize(width: w, height: h)))
    }
}
while case .divider? = items.last { items.removeLast() }
guard !items.isEmpty else { exit(1) }

let padX: CGFloat = 20, padY: CGFloat = 18, rowGap: CGFloat = 6, sectionGap: CGFloat = 12
var contentW: CGFloat = 0, contentH: CGFloat = 0
for (i, item) in items.enumerated() {
    switch item {
    case let .text(_, size), let .picture(_, size):
        contentW = max(contentW, size.width)
        contentH += size.height + (i > 0 ? rowGap : 0)
    case .divider:
        contentH += 2 * sectionGap + 1 - rowGap
    }
}
let width = max(420, ceil(contentW + 2 * padX)), height = ceil(contentH + 2 * padY)
let scale: CGFloat = 2
guard let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(width * scale), pixelsHigh: Int(height * scale),
                                 bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                                 colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0) else { exit(1) }
rep.size = NSSize(width: width, height: height)
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
NSGraphicsContext.current?.imageInterpolation = .high
let frame = NSBezierPath(roundedRect: NSRect(x: 0.5, y: 0.5, width: width - 1, height: height - 1), xRadius: 14, yRadius: 14)
bg.setFill()
frame.fill()
lineColor.setStroke()
frame.lineWidth = 1
frame.stroke()
var y = height - padY // AppKit draws from the bottom up
for (i, item) in items.enumerated() {
    switch item {
    case let .text(str, size):
        if i > 0 { y -= rowGap }
        y -= size.height
        str.draw(at: NSPoint(x: padX, y: y))
    case let .picture(img, size):
        if i > 0 { y -= rowGap }
        y -= size.height
        img.draw(in: NSRect(x: padX, y: y, width: size.width, height: size.height))
    case .divider:
        y -= sectionGap - rowGap
        lineColor.setFill()
        NSRect(x: padX, y: y - 1, width: width - 2 * padX, height: 1).fill()
        y -= 1 + sectionGap
    }
}
NSGraphicsContext.restoreGraphicsState()
guard let png = rep.representation(using: .png, properties: [:]),
      (try? png.write(to: URL(fileURLWithPath: outPath))) != nil else { exit(1) }
