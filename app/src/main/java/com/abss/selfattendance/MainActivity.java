package com.abss.selfattendance;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private static final int BACKUP_FILE_PICKER = 1001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        webView.setWebViewClient(new WebViewClient());
        webView.addJavascriptInterface(new WebAppInterface(), "Android");
        webView.loadUrl("file:///android_asset/index.html");
    }

    public class WebAppInterface {

        @JavascriptInterface
        public void printPage() {
            runOnUiThread(() -> createWebPrintJob());
        }

        @JavascriptInterface
        public void shareBackup(String jsonData, String fileName) {
            runOnUiThread(() -> createAndShareBackup(jsonData, fileName));
        }

        @JavascriptInterface
        public void selectBackupFile() {
            runOnUiThread(() -> openBackupFilePicker());
        }
    }

    private void createWebPrintJob() {
        PrintManager printManager =
                (PrintManager) getSystemService(Context.PRINT_SERVICE);

        PrintDocumentAdapter printAdapter =
                webView.createPrintDocumentAdapter("Self HRMS Salary Slip");

        printManager.print(
                "Self HRMS Salary Slip",
                printAdapter,
                new PrintAttributes.Builder().build()
        );
    }

    private void createAndShareBackup(String jsonData, String fileName) {
        try {
            if (fileName == null || fileName.trim().isEmpty()) {
                fileName = "Self_HRMS_Backup.json";
            }

            if (!fileName.toLowerCase().endsWith(".json")) {
                fileName = fileName + ".json";
            }

            // Prevent path characters in the generated cache filename.
            fileName = fileName.replace("/", "_").replace("\\", "_");

            File backupDirectory = new File(getCacheDir(), "backups");
            if (!backupDirectory.exists() && !backupDirectory.mkdirs()) {
                throw new Exception("Backup folder could not be created.");
            }

            File backupFile = new File(backupDirectory, fileName);

            try (FileOutputStream outputStream =
                         new FileOutputStream(backupFile)) {
                outputStream.write(
                        jsonData.getBytes(StandardCharsets.UTF_8)
                );
                outputStream.flush();
            }

            Uri fileUri = FileProvider.getUriForFile(
                    this,
                    getPackageName() + ".fileprovider",
                    backupFile
            );

            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("application/json");
            shareIntent.putExtra(Intent.EXTRA_STREAM, fileUri);
            shareIntent.putExtra(Intent.EXTRA_SUBJECT, "Self HRMS Backup");
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

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
                            : "Backup Error: " + e.getMessage()
            );
        }
    }

    private void openBackupFilePicker() {
        try {
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
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

            startActivityForResult(intent, BACKUP_FILE_PICKER);

        } catch (Exception e) {
            e.printStackTrace();
            showRestoreError("Backup file picker could not be opened.");
        }
    }

    @Override
    protected void onActivityResult(
            int requestCode,
            int resultCode,
            Intent data
    ) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode != BACKUP_FILE_PICKER ||
                resultCode != RESULT_OK ||
                data == null ||
                data.getData() == null) {
            return;
        }

        Uri uri = data.getData();

        try {
            String json = readTextFromUri(uri);

            if (json == null || json.trim().isEmpty()) {
                showRestoreError("Selected backup file is empty.");
                return;
            }

            sendBackupToWebView(json);

        } catch (Exception e) {
            e.printStackTrace();
            showRestoreError("Backup file could not be opened.");
        }
    }

    private String readTextFromUri(Uri uri) throws Exception {
        StringBuilder builder = new StringBuilder();

        try (InputStream inputStream =
                     getContentResolver().openInputStream(uri)) {

            if (inputStream == null) {
                return null;
            }

            try (BufferedReader reader =
                         new BufferedReader(
                                 new InputStreamReader(
                                         inputStream,
                                         StandardCharsets.UTF_8
                                 )
                         )) {

                String line;
                while ((line = reader.readLine()) != null) {
                    builder.append(line).append('\n');
                }
            }
        }

        return builder.toString();
    }

    private void sendBackupToWebView(String json) {
        String encoded = Base64.encodeToString(
                json.getBytes(StandardCharsets.UTF_8),
                Base64.NO_WRAP
        );

        String javascript =
                "(function(){" +
                "if(typeof window.restoreBackupFromAndroid==='function'){" +
                "window.restoreBackupFromAndroid('" + encoded + "');" +
                "}else{" +
                "alert('Restore function is not available.');" +
                "}" +
                "})()";

        runOnUiThread(() ->
                webView.evaluateJavascript(javascript, null)
        );
    }

    private void showRestoreError(String message) {
        String encoded = Base64.encodeToString(
                message.getBytes(StandardCharsets.UTF_8),
                Base64.NO_WRAP
        );

        runOnUiThread(() ->
                webView.evaluateJavascript(
                        "alert(decodeURIComponent(escape(atob('" +
                                encoded +
                                "'))));",
                        null
                )
        );
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
