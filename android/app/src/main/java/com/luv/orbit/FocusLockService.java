package com.luv.orbit;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.HashSet;

/**
 * Foreground service that polls the current foreground app while a focus
 * session is active, and covers blocked apps with a full-screen overlay.
 */
public class FocusLockService extends Service {

    public static volatile boolean isRunning = false;

    private static final long POLL_MS = 800;
    private static final int NOTIF_ID = 4711;
    private static final String CHANNEL = "focuslock";

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final HashSet<String> blocked = new HashSet<>();
    private UsageStatsManager usm;
    private WindowManager wm;
    private View overlay;
    private String lastForeground = "";

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            ArrayList<String> b = intent.getStringArrayListExtra("blocked");
            if (b != null) { blocked.clear(); blocked.addAll(b); }
        }
        startForeground(NOTIF_ID, buildNotification());
        isRunning = true;
        usm = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        handler.removeCallbacks(watcher);
        handler.post(watcher);
        return START_STICKY;
    }

    private final Runnable watcher = new Runnable() {
        @Override
        public void run() {
            String pkg = currentForegroundApp();
            if (pkg != null && !pkg.isEmpty()) {
                if (blocked.contains(pkg) && !pkg.equals(getPackageName())) {
                    showOverlay();
                } else {
                    hideOverlay();
                }
            }
            handler.postDelayed(this, POLL_MS);
        }
    };

    private String currentForegroundApp() {
        if (usm == null) return lastForeground;
        long now = System.currentTimeMillis();
        UsageEvents events = usm.queryEvents(now - 5000, now);
        UsageEvents.Event e = new UsageEvents.Event();
        String pkg = null;
        while (events.hasNextEvent()) {
            events.getNextEvent(e);
            int type = e.getEventType();
            if (type == UsageEvents.Event.MOVE_TO_FOREGROUND
                    || type == UsageEvents.Event.ACTIVITY_RESUMED) {
                pkg = e.getPackageName();
            }
        }
        if (pkg != null) lastForeground = pkg;
        return lastForeground;
    }

    private void showOverlay() {
        if (overlay != null) return;
        if (!Settings.canDrawOverlays(this)) return;

        overlay = buildOverlayView();
        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;
        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                type,
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
                PixelFormat.OPAQUE);
        lp.gravity = Gravity.CENTER;
        try { wm.addView(overlay, lp); } catch (Exception ex) { overlay = null; }
    }

    private void hideOverlay() {
        if (overlay != null && wm != null) {
            try { wm.removeView(overlay); } catch (Exception ignored) {}
            overlay = null;
        }
    }

    private View buildOverlayView() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setBackgroundColor(Color.parseColor("#08090C"));
        int pad = dp(40);
        root.setPadding(pad, pad, pad, pad);

        TextView eyebrow = new TextView(this);
        eyebrow.setText("◆  HYPERSPACE ENGAGED  ◆");
        eyebrow.setTextColor(Color.parseColor("#9B7BFF"));
        eyebrow.setTextSize(11);
        eyebrow.setLetterSpacing(0.25f);
        eyebrow.setGravity(Gravity.CENTER);

        TextView title = new TextView(this);
        title.setText("This app is locked");
        title.setTextColor(Color.parseColor("#F3F4F6"));
        title.setTextSize(24);
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, dp(16), 0, dp(10));

        TextView sub = new TextView(this);
        sub.setText("You're on a focus burn. Distractions can't reach you until it completes.");
        sub.setTextColor(Color.parseColor("#8B93BD"));
        sub.setTextSize(14);
        sub.setGravity(Gravity.CENTER);
        sub.setPadding(0, 0, 0, dp(40));

        Button back = new Button(this);
        back.setText("Return to Orbit");
        back.setAllCaps(false);
        back.setTextColor(Color.parseColor("#04121A"));
        back.setBackgroundColor(Color.parseColor("#46E0D0"));
        back.setOnClickListener(v -> {
            Intent i = getPackageManager().getLaunchIntentForPackage(getPackageName());
            if (i != null) {
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                startActivity(i);
            }
            hideOverlay();
        });

        root.addView(eyebrow);
        root.addView(title);
        root.addView(sub);
        root.addView(back);
        return root;
    }

    private Notification buildNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm.getNotificationChannel(CHANNEL) == null) {
                NotificationChannel ch = new NotificationChannel(
                        CHANNEL, "Focus Lock", NotificationManager.IMPORTANCE_LOW);
                ch.setDescription("Active while a focus burn is locking distractions");
                nm.createNotificationChannel(ch);
            }
        }
        Notification.Builder b = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, CHANNEL)
                : new Notification.Builder(this);
        return b.setContentTitle("Focus burn active")
                .setContentText("Distractions are locked")
                .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
                .setOngoing(true)
                .build();
    }

    private int dp(int v) {
        return (int) (v * getResources().getDisplayMetrics().density);
    }

    @Override
    public void onDestroy() {
        isRunning = false;
        handler.removeCallbacks(watcher);
        hideOverlay();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
