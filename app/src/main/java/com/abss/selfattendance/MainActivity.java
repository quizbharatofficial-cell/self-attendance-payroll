package com.abss.selfattendance;

import android.os.Bundle;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.database.Cursor;

import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;

import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;

import androidx.appcompat.app.AppCompatActivity;

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

        webView.setWebViewClient(
                new WebViewClient()
        );

        webView.addJavascriptInterface(
                new WebAppInterface(),
                "Android"
        );

        webView.loadUrl(
                "file:///android_asset/index.html"
        );
    }


    public class WebAppInterface {

        /*
         * Salary Slip PDF Print
         */
        @JavascriptInterface
        public void printPage() {

            runOnUiThread(() ->
                    createWebPrintJob()
            );
        }


        /*
         * Open Android system file picker.
         * Google Drive will appear there if available.
         */
        @JavascriptInterface
        public void selectBackupFile() {

            runOnUiThread(() -> {

                Intent intent =
                        new Intent(
                                Intent.ACTION_OPEN_DOCUMENT
                        );

                intent.addCategory(
                        Intent.CATEGORY_OPENABLE
                );

                intent.setType(
                        "application/json"
                );

                String[] mimeTypes = {
                        "application/json",
                        "text/json",
                        "text/plain",
                        "application/octet-stream"
                };

                intent.putExtra(
                        Intent.EXTRA_MIME_TYPES,
                        mimeTypes
                );

                startActivityForResult(
                        intent,
                        BACKUP_FILE_PICKER
                );
            });
        }
    }


    /*
     * Receive selected backup from
     * Files / Downloads / Google Drive.
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
                requestCode == BACKUP_FILE_PICKER &&
                resultCode == RESULT_OK &&
                data != null
        ) {

            Uri uri = data.getData();

            if (uri == null) {
                return;
            }

            try {

                String json =
                        readTextFromUri(uri);

                if (
                        json == null ||
                        json.trim().isEmpty()
                ) {

                    showRestoreError(
                            "Selected backup file is empty."
                    );

                    return;
                }

                sendBackupToWebView(json);

            } catch (Exception error) {

                error.printStackTrace();

                showRestoreError(
                        "Backup file could not be opened."
                );
            }
        }
    }


    /*
     * Read JSON selected through
     * Android Storage Access Framework.
     */
    private String readTextFromUri(
            Uri uri
    ) throws Exception {

        InputStream inputStream =
                getContentResolver()
                        .openInputStream(uri);

        if (inputStream == null) {
            return null;
        }

        BufferedReader reader =
                new BufferedReader(
                        new InputStreamReader(
                                inputStream
                        )
                );

        StringBuilder builder =
                new StringBuilder();

        String line;

        while (
                (line = reader.readLine()) != null
        ) {

            builder.append(line)
                    .append("\n");
        }

        reader.close();
        inputStream.close();

        return builder.toString();
    }


    /*
     * Send JSON safely into backup.html.
     *
     * backup.html needs:
     * window.restoreBackupFromAndroid(json)
     */
    private void sendBackupToWebView(
            String json
    ) {

        final String encoded =
                android.util.Base64.encodeToString(
                        json.getBytes(
                                java.nio.charset.StandardCharsets.UTF_8
                        ),
                        android.util.Base64.NO_WRAP
                );

        runOnUiThread(() -> {

            String javascript =
                    "javascript:(function(){" +
                    "if(typeof window.restoreBackupFromAndroid==='function'){" +
                    "window.restoreBackupFromAndroid(" +
                    "decodeURIComponent(escape(atob('" +
                    encoded +
                    "')))" +
                    ");" +
                    "}else{" +
                    "alert('Restore function is not available.');" +
                    "}" +
                    "})()";

            webView.evaluateJavascript(
                    javascript,
                    null
            );
        });
    }


    private void showRestoreError(
            String message
    ) {

        final String safeMessage =
                message
                        .replace("\\", "\\\\")
                        .replace("'", "\\'");

        runOnUiThread(() ->

                webView.evaluateJavascript(
                        "javascript:alert('" +
                        safeMessage +
                        "')",
                        null
                )
        );
    }


    /*
     * Android native PDF printing.
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

        String jobName =
                "Self HRMS Salary Slip";

        printManager.print(
                jobName,
                printAdapter,
                new PrintAttributes.Builder()
                        .build()
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