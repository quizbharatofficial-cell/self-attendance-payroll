package com.abss.selfattendance;

import android.os.Bundle;
import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.appcompat.app.AppCompatActivity;

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

        // JavaScript se Android Print function call karne ke liye
        webView.addJavascriptInterface(
                new WebAppInterface(),
                "Android"
        );

        webView.loadUrl("file:///android_asset/index.html");
    }

    public class WebAppInterface {

        @JavascriptInterface
        public void printPage() {
            runOnUiThread(() -> createWebPrintJob());
        }
    }

    private void createWebPrintJob() {

        PrintManager printManager =
                (PrintManager) getSystemService(Context.PRINT_SERVICE);

        PrintDocumentAdapter printAdapter =
                webView.createPrintDocumentAdapter("Self HRMS Salary Slip");

        String jobName = "Self HRMS Salary Slip";

        printManager.print(
                jobName,
                printAdapter,
                new PrintAttributes.Builder().build()
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