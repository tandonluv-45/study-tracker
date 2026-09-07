package com.luv.orbit;

import android.app.AppOpsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Process;
import android.provider.Settings;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;

/**
 * FocusLock — locks distracting apps during a focus session.
 * JS API: hasUsageAccess, requestUsageAccess, canDrawOverlays, requestOverlay,
 *         start({apps:[packageNames]}), stop(), isActive().
 */
@CapacitorPlugin(name = "FocusLock")
public class FocusLockPlugin extends Plugin {

    @PluginMethod
    public void hasUsageAccess(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", hasUsageStatsPermission());
        call.resolve(ret);
    }

    @PluginMethod
    public void requestUsageAccess(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }

    @PluginMethod
    public void canDrawOverlays(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", Settings.canDrawOverlays(getContext()));
        call.resolve(ret);
    }

    @PluginMethod
    public void requestOverlay(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getContext().getPackageName()));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }

    @PluginMethod
    public void start(PluginCall call) {
        ArrayList<String> list = new ArrayList<>();
        JSArray apps = call.getArray("apps");
        if (apps != null) {
            for (int k = 0; k < apps.length(); k++) {
                String p = apps.optString(k, "");
                if (!p.isEmpty()) list.add(p);
            }
        }
        Intent svc = new Intent(getContext(), FocusLockService.class);
        svc.putStringArrayListExtra("blocked", list);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(svc);
        } else {
            getContext().startService(svc);
        }
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), FocusLockService.class));
        call.resolve();
    }

    @PluginMethod
    public void isActive(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("active", FocusLockService.isRunning);
        call.resolve(ret);
    }

    // Returns the device's launchable (user-facing) apps, sorted by name.
    @PluginMethod
    public void listApps(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        Intent intent = new Intent(Intent.ACTION_MAIN, null);
        intent.addCategory(Intent.CATEGORY_LAUNCHER);
        List<ResolveInfo> ris = pm.queryIntentActivities(intent, 0);
        String self = getContext().getPackageName();
        HashSet<String> seen = new HashSet<>();
        ArrayList<String[]> apps = new ArrayList<>();
        for (ResolveInfo ri : ris) {
            String pkg = ri.activityInfo.packageName;
            if (pkg.equals(self) || seen.contains(pkg)) continue;
            seen.add(pkg);
            String label = ri.loadLabel(pm).toString();
            apps.add(new String[]{ pkg, label });
        }
        Collections.sort(apps, (a, b) -> a[1].compareToIgnoreCase(b[1]));
        JSArray arr = new JSArray();
        for (String[] a : apps) {
            JSObject o = new JSObject();
            o.put("pkg", a[0]);
            o.put("label", a[1]);
            arr.put(o);
        }
        JSObject ret = new JSObject();
        ret.put("apps", arr);
        call.resolve(ret);
    }

    private boolean hasUsageStatsPermission() {
        AppOpsManager appOps = (AppOpsManager) getContext().getSystemService(Context.APP_OPS_SERVICE);
        int mode;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            mode = appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(), getContext().getPackageName());
        } else {
            mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(), getContext().getPackageName());
        }
        return mode == AppOpsManager.MODE_ALLOWED;
    }
}
