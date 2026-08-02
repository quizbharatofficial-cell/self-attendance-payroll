package com.abss.selfattendance;

import android.os.Bundle;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;

import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;

import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends AppCompatActivity {

    private WebView webView;

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

        // JavaScript -> Android functions
        webView.addJavascriptInterface(
                new WebAppInterface(),
                "Android"
        );

        webView.loadUrl(
                "file:///android_asset/index.html"
        );
    }


    /*
     * JavaScript Interface
     */
    public class WebAppInterface {

        /*
         * Salary Slip Print / PDF
         */
        @JavascriptInterface
        public void printPage() {

            runOnUiThread(() -> createWebPrintJob());
        }


        /*
         * Backup JSON Share
         *
         * JavaScript:
         *
         * Android.shareBackup(jsonData, fileName);
         */
        @JavascriptInterface
        public void shareBackup(
                String jsonData,
                String fileName
        ) {

            runOnUiThread(() ->
                    createAndShareBackup(
                            jsonData,
                            fileName
                    )
            );
        }
    }


    /*
     * PRINT / SAVE PDF
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
                new PrintAttributes.Builder().build()
        );
    }


    /*
     * CREATE JSON BACKUP FILE
     * AND OPEN ANDROID SHARE SHEET
     */
    private void createAndShareBackup(
            String jsonData,
            String fileName
    ) {

        try {

            if (fileName == null ||
                    fileName.trim().isEmpty()) {

                fileName =
                        "Self_HRMS_Backup.json";
            }

            if (!fileName.endsWith(".json")) {

                fileName =
                        fileName + ".json";
            }


            /*
             * Create backup directory
             */
            File backupDirectory =
                    new File(
                            getCacheDir(),
                            "backups"
                    );

            if (!backupDirectory.exists()) {

                backupDirectory.mkdirs();
            }


            /*
             * Create JSON file
             */
            File backupFile =
                    new File(
                            backupDirectory,
                            fileName
                    );


            FileOutputStream outputStream =
                    new FileOutputStream(
                            backupFile
                    );

            outputStream.write(
                    jsonData.getBytes(
                            StandardCharsets.UTF_8
                    )
            );

            outputStream.flush();
            outputStream.close();


            /*
             * FileProvider URI
             */
            Uri fileUri =
                    FileProvider.getUriForFile(
                            this,
                            getPackageName()
                                    + ".fileprovider",
                            backupFile
                    );


            /*
             * Android Share Intent
             */
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


            /*
             * Open Share Sheet
             *
             * Google Drive will appear here
             * if installed on device.
             */
            startActivity(
                    Intent.createChooser(
                            shareIntent,
                            "Save / Share Self HRMS Backup"
                    )
            );


        } catch (Exception e) {

            e.printStackTrace();

            final String errorMessage =
                    e.getMessage() == null
                            ? "Backup share failed"
                            : e.getMessage();

            webView.evaluateJavascript(
                    "alert(" +
                            org.json.JSONObject.quote(
                                    "Backup Error: "
                                            + errorMessage
                            )
                            + ");",
                    null
            );
        }
    }


    /*
     * Android Back Button
     */
    @Override
    public void onBackPressed() {

        if (webView.canGoBack()) {

            webView.goBack();

        } else {

            super.onBackPressed();
        }
    }
}
