package com.blooms.blooms_app

import android.os.Bundle
import androidx.core.view.WindowCompat
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Android 15+ / edge-to-edge: avoid stacked system-gesture bar + extra inset,
        // which can look like two horizontal “home” pills at the bottom.
        WindowCompat.setDecorFitsSystemWindows(window, true)
        super.onCreate(savedInstanceState)
    }
}
