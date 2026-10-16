package de.fireassist.app;

import android.Manifest;
import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * FireAssist als Android-App: zeigt die mitgelieferte FireAssist.html an, ganz ohne Server.
 * Exporte werden unter Downloads/FireAssist gespeichert und zum Teilen angeboten,
 * externe Links (Navigation, GESTIS …) öffnen in der passenden App.
 */
public class MainActivity extends Activity {
    private static final int REQ_FILES = 1;
    private static final int REQ_LOCATION = 2;

    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private GeolocationPermissions.Callback geoCallback;
    private String geoOrigin;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setGeolocationEnabled(true);
        s.setAllowFileAccess(true);

        web.addJavascriptInterface(new Bridge(), "FireAssistAndroid");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme() == null ? "" : uri.getScheme();
                if (scheme.equals("file") || scheme.equals("about") || scheme.equals("blob") || scheme.equals("data")) {
                    return false;
                }
                openExternal(uri);
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                try {
                    startActivityForResult(Intent.createChooser(intent, "Datei wählen"), REQ_FILES);
                    return true;
                } catch (Exception e) {
                    fileCallback = null;
                    return false;
                }
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (hasLocationPermission()) {
                    callback.invoke(origin, true, false);
                    return;
                }
                geoOrigin = origin;
                geoCallback = callback;
                requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION}, REQ_LOCATION);
            }
        });

        if (state != null) web.restoreState(state);
        else web.loadUrl("file:///android_asset/FireAssist.html");
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    /** Zurück-Taste: erst Dialog, Suche, Seite oder Panel in der App schließen, dann die App in den Hintergrund. */
    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(window.FireAssistBack && window.FireAssistBack()) ? 'ja' : 'nein'",
                new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String value) {
                        if (value != null && value.contains("ja")) return;
                        if (web.canGoBack()) web.goBack();
                        else moveTaskToBack(true);
                    }
                });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQ_FILES && fileCallback != null) {
            Uri[] result = null;
            if (resultCode == RESULT_OK && data != null) {
                if (data.getClipData() != null) {
                    int n = data.getClipData().getItemCount();
                    result = new Uri[n];
                    for (int i = 0; i < n; i++) result[i] = data.getClipData().getItemAt(i).getUri();
                } else if (data.getData() != null) {
                    result = new Uri[]{data.getData()};
                }
            }
            fileCallback.onReceiveValue(result);
            fileCallback = null;
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        if (requestCode == REQ_LOCATION && geoCallback != null) {
            geoCallback.invoke(geoOrigin, hasLocationPermission(), false);
            geoCallback = null;
        }
    }

    private boolean hasLocationPermission() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private void openExternal(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (Exception e) {
            Toast.makeText(this, "Keine passende App gefunden.", Toast.LENGTH_SHORT).show();
        }
    }

    /** Wird aus JavaScript aufgerufen (window.FireAssistAndroid.saveFile). */
    private class Bridge {
        @JavascriptInterface
        public void saveFile(final String name, final String mime, final String base64) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    exportFile(name, mime, base64);
                }
            });
        }
    }

    private void exportFile(String name, String mime, String base64) {
        try {
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            String safe = name.replaceAll("[\\\\/:*?\"<>|]", "_");
            File dir = new File(getCacheDir(), "export");
            if (!dir.exists() && !dir.mkdirs()) throw new IllegalStateException("Ordner nicht anlegbar");
            File file = new File(dir, safe);
            try (FileOutputStream out = new FileOutputStream(file)) {
                out.write(bytes);
            }
            String saved = saveToDownloads(safe, mime, bytes);
            if (saved != null) Toast.makeText(this, "Gespeichert unter " + saved, Toast.LENGTH_LONG).show();

            Uri uri = Uri.parse("content://" + getPackageName() + ".export/" + Uri.encode(safe));
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType(mime);
            send.putExtra(Intent.EXTRA_STREAM, uri);
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(Intent.createChooser(send, "Datei teilen"));
        } catch (Exception e) {
            Toast.makeText(this, "Export fehlgeschlagen: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    /** Kopie im Download-Ordner (ab Android 10 ohne Zusatzberechtigung möglich). */
    private String saveToDownloads(String name, String mime, byte[] bytes) {
        if (Build.VERSION.SDK_INT < 29) return null;
        try {
            ContentValues v = new ContentValues();
            v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
            v.put(MediaStore.MediaColumns.MIME_TYPE, mime);
            v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/FireAssist");
            Uri item = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
            if (item == null) return null;
            try (OutputStream out = getContentResolver().openOutputStream(item)) {
                if (out == null) return null;
                out.write(bytes);
            }
            return "Downloads/FireAssist/" + name;
        } catch (Exception e) {
            return null;
        }
    }
}
