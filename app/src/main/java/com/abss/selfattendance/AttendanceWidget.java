package com.abss.selfattendance;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class AttendanceWidget extends AppWidgetProvider {

    public static final String ACTION_PUNCH_IN =
            "com.abss.selfattendance.PUNCH_IN";

    public static final String ACTION_PUNCH_OUT =
            "com.abss.selfattendance.PUNCH_OUT";

    public static final String PREFS =
            "SelfHRMSWidget";

    public static final String KEY_PUNCH_IN =
            "punchIn";

    public static final String KEY_PUNCH_OUT =
            "punchOut";


    @Override
    public void onUpdate(
            Context context,
            AppWidgetManager appWidgetManager,
            int[] appWidgetIds
    ) {

        for (int appWidgetId : appWidgetIds) {

            updateWidget(
                    context,
                    appWidgetManager,
                    appWidgetId
            );
        }


        SharedPreferences prefs =
                context.getSharedPreferences(
                        PREFS,
                        Context.MODE_PRIVATE
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


        /*
         * Start service only when attendance
         * is actually active.
         */
        if (punchIn > 0 && punchOut == 0) {

            startAttendanceService(
                    context
            );
        }
    }


    @Override
    public void onReceive(
            Context context,
            Intent intent
    ) {

        super.onReceive(
                context,
                intent
        );


        if (intent == null) {
            return;
        }


        String action =
                intent.getAction();


        SharedPreferences prefs =
                context.getSharedPreferences(
                        PREFS,
                        Context.MODE_PRIVATE
                );


        /*
         * =====================================================
         * PUNCH IN
         * =====================================================
         */
        if (ACTION_PUNCH_IN.equals(action)) {

            long currentPunch =
                    prefs.getLong(
                            KEY_PUNCH_IN,
                            0
                    );


            long currentPunchOut =
                    prefs.getLong(
                            KEY_PUNCH_OUT,
                            0
                    );


            /*
             * New attendance session.
             */
            if (
                    currentPunch == 0 ||
                    currentPunchOut > 0
            ) {

                prefs.edit()
                        .putLong(
                                KEY_PUNCH_IN,
                                System.currentTimeMillis()
                        )
                        .remove(
                                KEY_PUNCH_OUT
                        )
                        .apply();
            }


            /*
             * Start live notification.
             */
            startAttendanceService(
                    context
            );
        }


        /*
         * =====================================================
         * PUNCH OUT
         * =====================================================
         */
        else if (ACTION_PUNCH_OUT.equals(action)) {

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


            if (
                    punchIn > 0 &&
                    punchOut == 0
            ) {

                prefs.edit()
                        .putLong(
                                KEY_PUNCH_OUT,
                                System.currentTimeMillis()
                        )
                        .apply();
            }


            /*
             * IMPORTANT:
             *
             * Do NOT use startForegroundService()
             * just to stop the service.
             */
            stopAttendanceService(
                    context
            );
        }


        refreshAllWidgets(
                context
        );
    }


    /*
     * =========================================================
     * START LIVE ATTENDANCE SERVICE
     * =========================================================
     */

    public static void startAttendanceService(
            Context context
    ) {

        SharedPreferences prefs =
                context.getSharedPreferences(
                        PREFS,
                        Context.MODE_PRIVATE
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


        /*
         * Safety check.
         *
         * Never start foreground service unless
         * attendance is active.
         */
        if (
                punchIn <= 0 ||
                punchOut > 0
        ) {

            return;
        }


        Intent serviceIntent =
                new Intent(
                        context,
                        AttendanceService.class
                );


        serviceIntent.setAction(
                AttendanceService.ACTION_START
        );


        try {

            if (
                    Build.VERSION.SDK_INT
                            >= Build.VERSION_CODES.O
            ) {

                context.startForegroundService(
                        serviceIntent
                );

            } else {

                context.startService(
                        serviceIntent
                );
            }

        } catch (Exception e) {

            e.printStackTrace();
        }
    }


    /*
     * =========================================================
     * STOP LIVE ATTENDANCE SERVICE
     * =========================================================
     */

    public static void stopAttendanceService(
            Context context
    ) {

        Intent serviceIntent =
                new Intent(
                        context,
                        AttendanceService.class
                );


        /*
         * IMPORTANT FIX:
         *
         * We are stopping an existing service,
         * therefore startForegroundService()
         * must NOT be called here.
         */
        try {

            context.stopService(
                    serviceIntent
            );

        } catch (Exception e) {

            e.printStackTrace();
        }
    }


    /*
     * =========================================================
     * REFRESH ALL WIDGETS
     * =========================================================
     */

    public static void refreshAllWidgets(
            Context context
    ) {

        AppWidgetManager manager =
                AppWidgetManager.getInstance(
                        context
                );


        ComponentName component =
                new ComponentName(
                        context,
                        AttendanceWidget.class
                );


        int[] widgetIds =
                manager.getAppWidgetIds(
                        component
                );


        for (int widgetId : widgetIds) {

            updateWidget(
                    context,
                    manager,
                    widgetId
            );
        }
    }


    /*
     * =========================================================
     * UPDATE ONE WIDGET
     * =========================================================
     */

    public static void updateWidget(
            Context context,
            AppWidgetManager manager,
            int widgetId
    ) {

        SharedPreferences prefs =
                context.getSharedPreferences(
                        PREFS,
                        Context.MODE_PRIVATE
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


        RemoteViews views =
                new RemoteViews(
                        context.getPackageName(),
                        R.layout.attendance_widget
                );


        /*
         * =====================================================
         * PUNCH IN BUTTON
         * =====================================================
         */

        Intent inIntent =
                new Intent(
                        context,
                        AttendanceWidget.class
                );


        inIntent.setAction(
                ACTION_PUNCH_IN
        );


        PendingIntent inPendingIntent =
                PendingIntent.getBroadcast(
                        context,
                        101,
                        inIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT |
                                PendingIntent.FLAG_IMMUTABLE
                );


        views.setOnClickPendingIntent(
                R.id.widgetPunchIn,
                inPendingIntent
        );


        /*
         * =====================================================
         * PUNCH OUT BUTTON
         * =====================================================
         */

        Intent outIntent =
                new Intent(
                        context,
                        AttendanceWidget.class
                );


        outIntent.setAction(
                ACTION_PUNCH_OUT
        );


        PendingIntent outPendingIntent =
                PendingIntent.getBroadcast(
                        context,
                        102,
                        outIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT |
                                PendingIntent.FLAG_IMMUTABLE
                );


        views.setOnClickPendingIntent(
                R.id.widgetPunchOut,
                outPendingIntent
        );


        /*
         * =====================================================
         * OPEN SELF HRMS
         * =====================================================
         */

        Intent appIntent =
                new Intent(
                        context,
                        MainActivity.class
                );


        appIntent.setFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                        Intent.FLAG_ACTIVITY_CLEAR_TOP
        );


        PendingIntent appPendingIntent =
                PendingIntent.getActivity(
                        context,
                        103,
                        appIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT |
                                PendingIntent.FLAG_IMMUTABLE
                );


        views.setOnClickPendingIntent(
                R.id.widgetTitle,
                appPendingIntent
        );


        SimpleDateFormat timeFormat =
                new SimpleDateFormat(
                        "hh:mm a",
                        Locale.getDefault()
                );


        /*
         * =====================================================
         * NOT PUNCHED IN
         * =====================================================
         */

        if (punchIn == 0) {

            views.setTextViewText(
                    R.id.widgetStatus,
                    "Not Punched In"
            );


            views.setTextViewText(
                    R.id.widgetPunchTime,
                    "IN: --:--"
            );


            views.setTextViewText(
                    R.id.widgetWorkingTime,
                    "00:00:00"
            );


        } else {

            /*
             * =================================================
             * PUNCHED IN
             * =================================================
             */

            String inTime =
                    timeFormat.format(
                            new Date(
                                    punchIn
                            )
                    );


            views.setTextViewText(
                    R.id.widgetPunchTime,
                    "IN: " + inTime
            );


            long endTime;


            if (punchOut > 0) {

                endTime =
                        punchOut;


                views.setTextViewText(
                        R.id.widgetStatus,
                        "Punch Completed"
                );


            } else {

                endTime =
                        System.currentTimeMillis();


                views.setTextViewText(
                        R.id.widgetStatus,
                        "● Working"
                );
            }


            /*
             * Working duration.
             */
            long difference =
                    Math.max(
                            0,
                            endTime - punchIn
                    );


            long totalSeconds =
                    difference / 1000;


            long hours =
                    totalSeconds / 3600;


            long minutes =
                    (totalSeconds % 3600)
                            / 60;


            long seconds =
                    totalSeconds % 60;


            String workingTime =
                    String.format(
                            Locale.getDefault(),
                            "%02d:%02d:%02d",
                            hours,
                            minutes,
                            seconds
                    );


            views.setTextViewText(
                    R.id.widgetWorkingTime,
                    workingTime
            );
        }


        manager.updateAppWidget(
                widgetId,
                views
        );
    }
}
