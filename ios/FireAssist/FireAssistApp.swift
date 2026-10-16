import SwiftUI

/// FireAssist als iPhone-App: zeigt die mitgelieferte FireAssist.html an, ganz ohne Server.
@main
struct FireAssistApp: App {
    var body: some Scene {
        WindowGroup {
            WebView()
                .ignoresSafeArea()
        }
    }
}
