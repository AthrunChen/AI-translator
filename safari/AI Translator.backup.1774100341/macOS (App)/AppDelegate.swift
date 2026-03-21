import Cocoa

@main
class AppDelegate: NSObject, NSApplicationDelegate {

    func applicationDidFinishLaunching(_ notification: Notification) {
        // 禁用 Metal 渲染（macOS 26 兼容性）
        UserDefaults.standard.set(true, forKey: "NSAppKitDisableMetal")
        
        // 插入代码以在应用启动后初始化应用
        // 向用户展示开始使用扩展的说明
        showWelcomeWindow()
    }

    func applicationWillTerminate(_ notification: Notification) {
        // 插入代码以在应用终止前拆除应用
    }

    func applicationSupportsSecureRestorableState(_ app: NSApplication) -> Bool {
        return true
    }
    
    func showWelcomeWindow() {
        // 创建简单的欢迎窗口
        let alert = NSAlert()
        alert.messageText = "AI Translator 扩展"
        alert.informativeText = "请在 Safari → 设置 → 扩展中启用 AI Translator Extension。\n\n如果扩展未显示，请尝试重启 Safari 或重新启动应用。"
        alert.alertStyle = .informational
        alert.addButton(withTitle: "打开 Safari 设置")
        alert.addButton(withTitle: "稍后")
        
        let response = alert.runModal()
        if response == .alertFirstButtonReturn {
            // 打开 Safari 扩展设置
            if let url = URL(string: "x-apple.systempreferences:com.apple.Safari.ExtensionsPreferences") {
                NSWorkspace.shared.open(url)
            }
        }
    }
}
