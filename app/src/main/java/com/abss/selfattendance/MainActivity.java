package com.abss.selfattendance;

import android.Manifest;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class MainActivity extends AppCompatActivity {

    private WebView webView;

    private static final String GITHUB_LATEST_RELEASE_API =
            "https://api.github.com/repos/quizbharatofficial-cell/self-attendance-payroll/releases/latest";

    private static final String UPDATE_APK_NAME =
            "Self_HRMS_Update.apk";

    private static final int BACKUP_FILE_PICKER = 1001;

    private static final int NOTIFICATION_PERMISSION_REQUEST = 2001;

    private static final String WIDGET_PREFS =
            "SelfHRMSWidget";

    private static final String KEY_PUNCH_IN =
            "punchIn";

    private static final String KEY_PUNCH_OUT =
            "punchOut";


    @Override
    protected void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);

        /*
         * Android 13+ notification permission
         */
        requestNotificationPermission();


        webView = new WebView(this);

        setContentView(webView);


        WebSettings settings =
                webView.getSettings();

        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);


        webView.setWebViewClient(
                new WebViewClient() {

                    @Override
                    public void onPageFinished(
                            WebView view,
                            String url
                    ) {

                        super.onPageFinished(
                                view,
                                url
                        );

                        /*
                         * Send pending Widget attendance
                         * to the WebView.
                         */
                        sendWidgetDataToWebView();
                    }
                }
        );


        webView.addJavascriptInterface(
                new WebAppInterface(),
                "Android"
        );


        webView.loadUrl(
                "file:///android_asset/index.html"
        );
    }


    /*
     * =========================================================
     * NOTIFICATION PERMISSION
     * =========================================================
     */

    private void requestNotificationPermission() {

        if (
                Build.VERSION.SDK_INT
                        >= Build.VERSION_CODES.TIRAMISU
        ) {

            if (
                    ContextCompat.checkSelfPermission(
                            this,
                            Manifest.permission.POST_NOTIFICATIONS
                    )
                            != PackageManager.PERMISSION_GRANTED
            ) {

                ActivityCompat.requestPermissions(
                        this,
                        new String[]{
                                Manifest.permission.POST_NOTIFICATIONS
                        },
                        NOTIFICATION_PERMISSION_REQUEST
                );
            }
        }
    }


    /*
     * =========================================================
     * JAVASCRIPT INTERFACE
     * =========================================================
     */

    public class WebAppInterface {


        /*
         * =========================
         * PDF PRINT
         * =========================
         */

        @JavascriptInterface
        public void printPage() {

            runOnUiThread(
                    () -> createWebPrintJob()
            );
        }


        /*
         * =========================
         * BACKUP SHARE
         * =========================
         */

        @JavascriptInterface
        public void shareBackup(
                String jsonData,
                String fileName
        ) {

            runOnUiThread(
                    () -> createAndShareBackup(
                            jsonData,
                            fileName
                    )
            );
        }


        /*
         * =========================
         * BACKUP RESTORE
         * =========================
         */

        @JavascriptInterface
        public void selectBackupFile() {

            runOnUiThread(
                    () -> openBackupFilePicker()
            );
        }


        /*
         * =====================================================
         * GET WIDGET PUNCH IN
         * =====================================================
         */

        @JavascriptInterface
        public long getWidgetPunchIn() {

            SharedPreferences prefs =
                    getSharedPreferences(
                            WIDGET_PREFS,
                            MODE_PRIVATE
                    );

            return prefs.getLong(
                    KEY_PUNCH_IN,
                    0
            );
        }


        /*
         * =====================================================
         * GET WIDGET PUNCH OUT
         * =====================================================
         */

        @JavascriptInterface
        public long getWidgetPunchOut() {

            SharedPreferences prefs =
                    getSharedPreferences(
                            WIDGET_PREFS,
                            MODE_PRIVATE
                    );

            return prefs.getLong(
                    KEY_PUNCH_OUT,
                    0
            );
        }


        /*
         * =====================================================
         * CLEAR COMPLETED WIDGET PUNCH
         * =====================================================
         */

        @JavascriptInterface
        public void clearWidgetPunch() {

            SharedPreferences prefs =
                    getSharedPreferences(
                            WIDGET_PREFS,
                            MODE_PRIVATE
                    );


            prefs.edit()
                    .remove(KEY_PUNCH_IN)
                    .remove(KEY_PUNCH_OUT)
                    .apply();


            /*
             * Attendance is completed,
             * stop live notification.
             */
            AttendanceWidget.stopAttendanceService(
                    MainActivity.this
            );


            refreshWidgets();
        }


        /*
         * =====================================================
         * UPDATE WIDGET FROM WEB ATTENDANCE
         * =====================================================
         */

        @JavascriptInterface
        public void updateWidgetPunch(
                long punchIn,
                long punchOut
        ) {

            SharedPreferences prefs =
                    getSharedPreferences(
                            WIDGET_PREFS,
                            MODE_PRIVATE
                    );


            SharedPreferences.Editor editor =
                    prefs.edit();


            /*
             * Save Punch IN
             */
            if (punchIn > 0) {

                editor.putLong(
                        KEY_PUNCH_IN,
                        punchIn
                );

            } else {

                editor.remove(
                        KEY_PUNCH_IN
                );
            }


            /*
             * Save Punch OUT
             */
            if (punchOut > 0) {

                editor.putLong(
                        KEY_PUNCH_OUT,
                        punchOut
                );

            } else {

                editor.remove(
                        KEY_PUNCH_OUT
                );
            }


            editor.apply();


            /*
             * Active attendance:
             * Start live notification service.
             */
            if (
                    punchIn > 0 &&
                    punchOut == 0
            ) {

                AttendanceWidget.startAttendanceService(
                        MainActivity.this
                );

            } else {

                /*
                 * Attendance completed / cleared.
                 */
                AttendanceWidget.stopAttendanceService(
                        MainActivity.this
                );
            }


            refreshWidgets();
        }

        /*
         * =====================================================
         * IN-APP UPDATE
         * =====================================================
         */

        @JavascriptInterface
        public void checkForUpdate() {
            checkForAppUpdate();
        }

        @JavascriptInterface
        public String getAppVersion() {
            return getInstalledVersionName();
        }
    }


    /*
     * =========================================================
     * SEND WIDGET DATA TO WEBVIEW
     * =========================================================
     */

    private void sendWidgetDataToWebView() {

        SharedPreferences prefs =
                getSharedPreferences(
                        WIDGET_PREFS,
                        MODE_PRIVATE
                );


        long punchIn =
                prefs.getLong(
                        KEY_PUNCH_IN,
                        0
                );


        long punchOut =
                prefs.getLong(
                        KEY_PUNCH_OUT,
                        0
                );


        String javascript =
                "(function(){" +

                        "if(typeof window.receiveWidgetAttendance===" +
                        "'function'){" +

                        "window.receiveWidgetAttendance(" +
                        punchIn +
                        "," +
                        punchOut +
                        ");" +

                        "}" +

                        "})()";


        runOnUiThread(
                () ->
                        webView.evaluateJavascript(
                                javascript,
                                null
                        )
        );
    }


    /*
     * =========================================================
     * REFRESH HOME SCREEN WIDGET
     * =========================================================
     */

    private void refreshWidgets() {

        runOnUiThread(
                () -> {

                    android.appwidget.AppWidgetManager manager =
                            android.appwidget.AppWidgetManager
                                    .getInstance(
                                            MainActivity.this
                                    );


                    android.content.ComponentName component =
                            new android.content.ComponentName(
                                    MainActivity.this,
                                    AttendanceWidget.class
                            );


                    int[] widgetIds =
                            manager.getAppWidgetIds(
                                    component
                            );


                    for (int widgetId : widgetIds) {

                        AttendanceWidget.updateWidget(
                                MainActivity.this,
                                manager,
                                widgetId
                        );
                    }
                }
        );
    }


    /*
     * =========================================================
     * PDF PRINT
     * =========================================================
     */

    private void createWebPrintJob() {

        PrintManager printManager =
                (PrintManager)
                        getSystemService(
                                Context.PRINT_SERVICE
                        );


        PrintDocumentAdapter printAdapter =
                webView.createPrintDocumentAdapter(
                        "Self HRMS Salary Slip"
                );


        printManager.print(
                "Self HRMS Salary Slip",
                printAdapter,
                new PrintAttributes.Builder()
                        .build()
        );
    }


    /*
     * =========================================================
     * BACKUP SHARE / GOOGLE DRIVE
     * =========================================================
     */

    private void createAndShareBackup(
            String jsonData,
            String fileName
    ) {

        try {

            /*
             * Default backup filename.
             */
            if (
                    fileName == null ||
                    fileName.trim().isEmpty()
            ) {

                fileName =
                        "Self_HRMS_Backup.json";
            }


            /*
             * Make sure extension is JSON.
             */
            if (
                    !fileName
                            .toLowerCase()
                            .endsWith(".json")
            ) {

                fileName =
                        fileName + ".json";
            }


            /*
             * Remove unsafe path characters.
             */
            fileName =
                    fileName
                            .replace("/", "_")
                            .replace("\\", "_");


            File backupDirectory =
                    new File(
                            getCacheDir(),
                            "backups"
                    );


            if (
                    !backupDirectory.exists() &&
                    !backupDirectory.mkdirs()
            ) {

                throw new Exception(
                        "Backup folder could not be created."
                );
            }


            File backupFile =
                    new File(
                            backupDirectory,
                            fileName
                    );


            try (
                    FileOutputStream outputStream =
                            new FileOutputStream(
                                    backupFile
                            )
            ) {

                outputStream.write(
                        jsonData.getBytes(
                                StandardCharsets.UTF_8
                        )
                );

                outputStream.flush();
            }


            Uri fileUri =
                    FileProvider.getUriForFile(
                            this,
                            getPackageName()
                                    + ".fileprovider",
                            backupFile
                    );


            Intent shareIntent =
                    new Intent(
                            Intent.ACTION_SEND
                    );


            shareIntent.setType(
                    "application/json"
            );


            shareIntent.putExtra(
                    Intent.EXTRA_STREAM,
                    fileUri
            );


            shareIntent.putExtra(
                    Intent.EXTRA_SUBJECT,
                    "Self HRMS Backup"
            );


            shareIntent.addFlags(
                    Intent.FLAG_GRANT_READ_URI_PERMISSION
            );


            startActivity(
                    Intent.createChooser(
                            shareIntent,
                            "Save / Share Self HRMS Backup"
                    )
            );


        } catch (Exception e) {

            e.printStackTrace();


            showRestoreError(
                    e.getMessage() == null
                            ? "Backup share failed."
                            : "Backup Error: "
                            + e.getMessage()
            );
        }
    }


    /*
     * =========================================================
     * BACKUP FILE PICKER
     * =========================================================
     */

    private void openBackupFilePicker() {

        try {

            Intent intent =
                    new Intent(
                            Intent.ACTION_OPEN_DOCUMENT
                    );


            intent.addCategory(
                    Intent.CATEGORY_OPENABLE
            );


            intent.setType("*/*");


            intent.putExtra(
                    Intent.EXTRA_MIME_TYPES,
                    new String[]{
                            "application/json",
                            "text/json",
                            "text/plain",
                            "application/octet-stream"
                    }
            );


            startActivityForResult(
                    intent,
                    BACKUP_FILE_PICKER
            );


        } catch (Exception e) {

            e.printStackTrace();


            showRestoreError(
                    "Backup file picker could not be opened."
            );
        }
    }


    /*
     * =========================================================
     * BACKUP RESTORE RESULT
     * =========================================================
     */

    @Override
    protected void onActivityResult(
            int requestCode,
            int resultCode,
            Intent data
    ) {

        super.onActivityResult(
                requestCode,
                resultCode,
                data
        );


        if (
                requestCode != BACKUP_FILE_PICKER ||
                resultCode != RESULT_OK ||
                data == null ||
                data.getData() == null
        ) {

            return;
        }


        Uri uri =
                data.getData();


        try {

            String json =
                    readTextFromUri(
                            uri
                    );


            if (
                    json == null ||
                    json.trim().isEmpty()
            ) {

                showRestoreError(
                        "Selected backup file is empty."
                );

                return;
            }


            sendBackupToWebView(
                    json
            );


        } catch (Exception e) {

            e.printStackTrace();


            showRestoreError(
                    "Backup file could not be opened."
            );
        }
    }


    /*
     * =========================================================
     * READ BACKUP FILE
     * =========================================================
     */

    private String readTextFromUri(
            Uri uri
    ) throws Exception {

        StringBuilder builder =
                new StringBuilder();


        try (
                InputStream inputStream =
                        getContentResolver()
                                .openInputStream(
                                        uri
                                )
        ) {


            if (inputStream == null) {

                return null;
            }


            try (
                    BufferedReader reader =
                            new BufferedReader(
                                    new InputStreamReader(
                                            inputStream,
                                            StandardCharsets.UTF_8
                                    )
                            )
            ) {


                String line;


                while (
                        (line =
                                reader.readLine())
                                != null
                ) {

                    builder
                            .append(line)
                            .append('\n');
                }
            }
        }


        return builder.toString();
    }


    /*
     * =========================================================
     * SEND RESTORE DATA TO JAVASCRIPT
     * =========================================================
     */

    private void sendBackupToWebView(
            String json
    ) {

        String encoded =
                Base64.encodeToString(
                        json.getBytes(
                                StandardCharsets.UTF_8
                        ),
                        Base64.NO_WRAP
                );


        String javascript =
                "(function(){" +

                        "if(typeof window.restoreBackupFromAndroid===" +
                        "'function'){" +

                        "window.restoreBackupFromAndroid('" +
                        encoded +
                        "');" +

                        "}else{" +

                        "alert('Restore function is not available.');" +

                        "}" +

                        "})()";


        runOnUiThread(
                () ->
                        webView.evaluateJavascript(
                                javascript,
                                null
                        )
        );
    }


    /*
     * =========================================================
     * ERROR MESSAGE
     * =========================================================
     */

    private void showRestoreError(
            String message
    ) {

        String encoded =
                Base64.encodeToString(
                        message.getBytes(
                                StandardCharsets.UTF_8
                        ),
                        Base64.NO_WRAP
                );


        runOnUiThread(
                () ->
                        webView.evaluateJavascript(

                                "alert(decodeURIComponent(" +
                                        "escape(atob('" +
                                        encoded +
                                        "'))));",

                                null
                        )
        );
    }


    /*
     * =========================================================
     * SELF HRMS IN-APP UPDATE
     * =========================================================
     */

    private String getInstalledVersionName() {
        try {
            return getPackageManager()
                    .getPackageInfo(getPackageName(), 0)
                    .versionName;
        } catch (Exception e) {
            return "0.0.0";
        }
    }


    private void checkForAppUpdate() {

        runOnUiThread(
                () -> Toast.makeText(
                        MainActivity.this,
                        "Checking for update...",
                        Toast.LENGTH_SHORT
                ).show()
        );

        new Thread(() -> {

            HttpURLConnection connection = null;

            try {

                URL url =
                        new URL(
                                GITHUB_LATEST_RELEASE_API
                        );

                connection =
                        (HttpURLConnection)
                                url.openConnection();

                connection.setRequestMethod("GET");
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(15000);

                connection.setRequestProperty(
                        "Accept",
                        "application/vnd.github+json"
                );

                connection.setRequestProperty(
                        "User-Agent",
                        "Self-HRMS-Android"
                );


                int responseCode =
                        connection.getResponseCode();


                if (responseCode !=
                        HttpURLConnection.HTTP_OK) {

                    throw new Exception(
                            "GitHub response: "
                                    + responseCode
                    );
                }


                String response;

                try (
                        InputStream inputStream =
                                connection.getInputStream();

                        BufferedReader reader =
                                new BufferedReader(
                                        new InputStreamReader(
                                                inputStream,
                                                StandardCharsets.UTF_8
                                        )
                                )
                ) {

                    StringBuilder builder =
                            new StringBuilder();

                    String line;

                    while (
                            (line = reader.readLine())
                                    != null
                    ) {
                        builder.append(line);
                    }

                    response =
                            builder.toString();
                }


                JSONObject release =
                        new JSONObject(response);


                /*
                 * GitHub Release Notes / What's New
                 */
                String releaseNotes =
                        release.optString(
                                "body",
                                ""
                        );

                if (
                        releaseNotes == null ||
                        releaseNotes.trim().isEmpty()
                ) {

                    releaseNotes =
                            "• Performance improvements\n"
                                    + "• Bug fixes";
                }


                String latestTag =
                        release.optString(
                                "tag_name",
                                ""
                        );


                String latestVersion =
                        latestTag
                                .trim()
                                .replaceFirst(
                                        "^[vV]",
                                        ""
                                );


                String currentVersion =
                        getInstalledVersionName();


                JSONArray assets =
                        release.optJSONArray(
                                "assets"
                        );


                String apkUrl =
                        null;


                if (assets != null) {

                    for (
                            int i = 0;
                            i < assets.length();
                            i++
                    ) {

                        JSONObject asset =
                                assets.getJSONObject(i);


                        String name =
                                asset.optString(
                                        "name",
                                        ""
                                );


                        if (
                                name.toLowerCase()
                                        .endsWith(".apk")
                        ) {

                            apkUrl =
                                    asset.optString(
                                            "browser_download_url",
                                            null
                                    );

                            if (
                                    name.toLowerCase()
                                            .contains("release") ||
                                    name.equalsIgnoreCase(
                                            "Self-HRMS.apk"
                                    )
                            ) {
                                break;
                            }
                        }
                    }
                }


                if (
                        latestVersion.isEmpty()
                ) {

                    throw new Exception(
                            "Latest version not found."
                    );
                }


                final String finalLatestVersion =
                        latestVersion;

                final String finalCurrentVersion =
                        currentVersion;

                final String finalApkUrl =
                        apkUrl;

                final String finalReleaseNotes =
                        releaseNotes;


                runOnUiThread(() -> {

                    if (
                            compareVersions(
                                    finalLatestVersion,
                                    finalCurrentVersion
                            ) <= 0
                    ) {

                        new AlertDialog.Builder(
                                MainActivity.this
                        )
                                .setTitle(
                                        "Self HRMS"
                                )
                                .setMessage(
                                        "You already have the latest version.\n\n"
                                                + "Current version: "
                                                + finalCurrentVersion
                                )
                                .setPositiveButton(
                                        "OK",
                                        null
                                )
                                .show();

                        return;
                    }


                    if (
                            finalApkUrl == null ||
                            finalApkUrl.trim()
                                    .isEmpty()
                    ) {

                        new AlertDialog.Builder(
                                MainActivity.this
                        )
                                .setTitle(
                                        "Update Available"
                                )
                                .setMessage(
                                        "Version "
                                                + finalLatestVersion
                                                + " is available, but no APK file was found in the GitHub release."
                                )
                                .setPositiveButton(
                                        "OK",
                                        null
                                )
                                .show();

                        return;
                    }


                    new AlertDialog.Builder(
                            MainActivity.this
                    )
                            .setTitle(
                                    "Update Available"
                            )
                            .setMessage(
                                    "Current version: "
                                            + finalCurrentVersion
                                            + "\nNew version: "
                                            + finalLatestVersion
                                            + "\n\nWhat's New:\n"
                                            + finalReleaseNotes
                                            + "\n\nDownload and install the update?"
                            )
                            .setNegativeButton(
                                    "Later",
                                    null
                            )
                            .setPositiveButton(
                                    "Update",
                                    (dialog, which) ->
                                            downloadUpdateApk(
                                                    finalApkUrl,
                                                    finalLatestVersion
                                            )
                            )
                            .show();
                });


            } catch (Exception e) {

                e.printStackTrace();

                final String message =
                        e.getMessage() == null
                                ? "Could not check for update."
                                : e.getMessage();


                runOnUiThread(
                        () ->
                                new AlertDialog.Builder(
                                        MainActivity.this
                                )
                                        .setTitle(
                                                "Update Check Failed"
                                        )
                                        .setMessage(
                                                message
                                        )
                                        .setPositiveButton(
                                                "OK",
                                                null
                                        )
                                        .show()
                );

            } finally {

                if (connection != null) {
                    connection.disconnect();
                }
            }

        }).start();
    }


    private int compareVersions(
            String first,
            String second
    ) {

        String[] a =
                first.split("\\.");

        String[] b =
                second.split("\\.");


        int length =
                Math.max(
                        a.length,
                        b.length
                );


        for (
                int i = 0;
                i < length;
                i++
        ) {

            int x =
                    i < a.length
                            ? parseVersionPart(
                                    a[i]
                            )
                            : 0;

            int y =
                    i < b.length
                            ? parseVersionPart(
                                    b[i]
                            )
                            : 0;


            if (x < y) {
                return -1;
            }

            if (x > y) {
                return 1;
            }
        }


        return 0;
    }


    private int parseVersionPart(
            String value
    ) {

        try {

            String cleaned =
                    value.replaceAll(
                            "[^0-9].*$",
                            ""
                    );


            if (cleaned.isEmpty()) {
                return 0;
            }


            return Integer.parseInt(
                    cleaned
            );

        } catch (Exception e) {

            return 0;
        }
    }


    private void downloadUpdateApk(
            String apkUrl,
            String latestVersion
    ) {

        runOnUiThread(
                () ->
                        Toast.makeText(
                                MainActivity.this,
                                "Downloading Self HRMS "
                                        + latestVersion
                                        + "...",
                                Toast.LENGTH_LONG
                        ).show()
        );


        new Thread(() -> {

            HttpURLConnection connection =
                    null;


            try {

                File updateDirectory =
                        new File(
                                getCacheDir(),
                                "updates"
                        );


                if (
                        !updateDirectory.exists() &&
                        !updateDirectory.mkdirs()
                ) {

                    throw new Exception(
                            "Update folder could not be created."
                    );
                }


                File apkFile =
                        new File(
                                updateDirectory,
                                UPDATE_APK_NAME
                        );


                if (
                        apkFile.exists() &&
                        !apkFile.delete()
                ) {

                    throw new Exception(
                            "Old update file could not be removed."
                    );
                }


                URL url =
                        new URL(
                                apkUrl
                        );


                connection =
                        (HttpURLConnection)
                                url.openConnection();


                connection.setConnectTimeout(
                        20000
                );

                connection.setReadTimeout(
                        30000
                );

                connection.setRequestProperty(
                        "User-Agent",
                        "Self-HRMS-Android"
                );


                connection.connect();


                int responseCode =
                        connection.getResponseCode();


                if (
                        responseCode < 200 ||
                        responseCode >= 300
                ) {

                    throw new Exception(
                            "APK download failed: "
                                    + responseCode
                    );
                }


                try (
                        InputStream inputStream =
                                connection.getInputStream();

                        FileOutputStream outputStream =
                                new FileOutputStream(
                                        apkFile
                                )
                ) {

                    byte[] buffer =
                            new byte[8192];


                    int count;


                    while (
                            (count =
                                    inputStream.read(
                                            buffer
                                    ))
                                    != -1
                    ) {

                        outputStream.write(
                                buffer,
                                0,
                                count
                        );
                    }


                    outputStream.flush();
                }


                if (
                        !apkFile.exists() ||
                        apkFile.length() <= 0
                ) {

                    throw new Exception(
                            "Downloaded APK is empty."
                    );
                }


                runOnUiThread(
                        () ->
                                requestInstallApk(
                                        apkFile
                                )
                );


            } catch (Exception e) {

                e.printStackTrace();


                final String message =
                        e.getMessage() == null
                                ? "Update download failed."
                                : e.getMessage();


                runOnUiThread(
                        () ->
                                new AlertDialog.Builder(
                                        MainActivity.this
                                )
                                        .setTitle(
                                                "Download Failed"
                                        )
                                        .setMessage(
                                                message
                                        )
                                        .setPositiveButton(
                                                "OK",
                                                null
                                        )
                                        .show()
                );


            } finally {

                if (connection != null) {
                    connection.disconnect();
                }
            }

        }).start();
    }


    private void requestInstallApk(
            File apkFile
    ) {

        try {

            if (
                    Build.VERSION.SDK_INT
                            >= Build.VERSION_CODES.O &&
                    !getPackageManager()
                            .canRequestPackageInstalls()
            ) {

                new AlertDialog.Builder(
                        this
                )
                        .setTitle(
                                "Allow App Updates"
                        )
                        .setMessage(
                                "Android needs permission to install Self HRMS updates. Enable \"Allow from this source\", then return to Self HRMS and press Check for Update again."
                        )
                        .setNegativeButton(
                                "Cancel",
                                null
                        )
                        .setPositiveButton(
                                "Open Settings",
                                (dialog, which) -> {

                                    Intent settingsIntent =
                                            new Intent(
                                                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                                                    Uri.parse(
                                                            "package:"
                                                                    + getPackageName()
                                                    )
                                            );


                                    startActivity(
                                            settingsIntent
                                    );
                                }
                        )
                        .show();


                return;
            }


            Uri apkUri =
                    FileProvider.getUriForFile(
                            this,
                            getPackageName()
                                    + ".fileprovider",
                            apkFile
                    );


            Intent installIntent =
                    new Intent(
                            Intent.ACTION_VIEW
                    );


            installIntent.setDataAndType(
                    apkUri,
                    "application/vnd.android.package-archive"
            );


            installIntent.addFlags(
                    Intent.FLAG_GRANT_READ_URI_PERMISSION |
                            Intent.FLAG_ACTIVITY_NEW_TASK
            );


            startActivity(
                    installIntent
            );


        } catch (Exception e) {

            e.printStackTrace();


            new AlertDialog.Builder(
                    this
            )
                    .setTitle(
                            "Install Failed"
                    )
                    .setMessage(
                            e.getMessage() == null
                                    ? "Android installer could not be opened."
                                    : e.getMessage()
                    )
                    .setPositiveButton(
                            "OK",
                            null
                    )
                    .show();
        }
    }


    /*
     * =========================================================
     * ANDROID BACK BUTTON
     * =========================================================
     */

    @Override
    public void onBackPressed() {

        if (
                webView != null &&
                webView.canGoBack()
        ) {

            webView.goBack();

        } else {

            super.onBackPressed();
        }
    }
}
