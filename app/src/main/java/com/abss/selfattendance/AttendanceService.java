package com.abss.selfattendance;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import androidx.core.app.NotificationCompat;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class AttendanceService extends Service {

    public static final String ACTION_START =
            "com.abss.selfattendance.ATTENDANCE_START";

    public static final String ACTION_STOP =
            "com.abss.selfattendance.ATTENDANCE_STOP";

    private static final String CHANNEL_ID =
            "self_hrms_attendance";

    private static final int NOTIFICATION_ID =
            1001;

    private Handler handler;

    private boolean foregroundStarted =
            false;


    /*
     * =========================================================
     * TIMER
     * =========================================================
     */

    private final Runnable timerRunnable =
            new Runnable() {

                @Override
                public void run() {

                    if (!isAttendanceActive()) {

                        stopAttendanceService();
                        return;
                    }


                    updateNotification();


                    /*
                     * Refresh widget so its displayed
                     * working duration also gets updated.
                     */
                    AttendanceWidget.refreshAllWidgets(
                            AttendanceService.this
                    );


                    if (handler != null) {

                        handler.postDelayed(
                                this,
                                1000
                        );
                    }
                }
            };


    /*
     * =========================================================
     * SERVICE CREATED
     * =========================================================
     */

    @Override
    public void onCreate() {

        super.onCreate();


        handler =
                new Handler(
                        Looper.getMainLooper()
                );


        createNotificationChannel();
    }


    /*
     * =========================================================
     * SERVICE START
     * =========================================================
     */

    @Override
    public int onStartCommand(
            Intent intent,
            int flags,
            int startId
    ) {

        /*
         * IMPORTANT:
         *
         * If Android launched us using
         * startForegroundService(), promote this
         * service to foreground immediately.
         *
         * Do this BEFORE checking attendance state.
         */
        try {

            startForeground(
                    NOTIFICATION_ID,
                    buildNotification()
            );

            foregroundStarted =
                    true;

        } catch (Exception e) {

            e.printStackTrace();

            stopSelf();

            return START_NOT_STICKY;
        }


        String action =
                intent != null
                        ? intent.getAction()
                        : ACTION_START;


        /*
         * =====================================================
         * STOP ACTION
         * =====================================================
         */

        if (ACTION_STOP.equals(action)) {

            completePunchOut();

            stopAttendanceService();

            return START_NOT_STICKY;
        }


        /*
         * =====================================================
         * NO ACTIVE ATTENDANCE
         * =====================================================
         */

        if (!isAttendanceActive()) {

            stopAttendanceService();

            return START_NOT_STICKY;
        }


        /*
         * =====================================================
         * START / RESTART TIMER
         * =====================================================
         */

        if (handler != null) {

            handler.removeCallbacks(
                    timerRunnable
            );

            handler.post(
                    timerRunnable
            );
        }


        return START_STICKY;
    }


    /*
     * =========================================================
     * CHECK ACTIVE ATTENDANCE
     * =========================================================
     */

    private boolean isAttendanceActive() {

        SharedPreferences prefs =
                getSharedPreferences(
                        AttendanceWidget.PREFS,
                        MODE_PRIVATE
                );


        long punchIn =
                prefs.getLong(
                        AttendanceWidget.KEY_PUNCH_IN,
                        0
                );


        long punchOut =
                prefs.getLong(
                        AttendanceWidget.KEY_PUNCH_OUT,
                        0
                );


        return punchIn > 0 &&
                punchOut == 0;
    }


    /*
     * =========================================================
     * COMPLETE PUNCH OUT
     * =========================================================
     */

    private void completePunchOut() {

        SharedPreferences prefs =
                getSharedPreferences(
                        AttendanceWidget.PREFS,
                        MODE_PRIVATE
                );


        long punchIn =
                prefs.getLong(
                        AttendanceWidget.KEY_PUNCH_IN,
                        0
                );


        long punchOut =
                prefs.getLong(
                        AttendanceWidget.KEY_PUNCH_OUT,
                        0
                );


        if (
                punchIn > 0 &&
                punchOut == 0
        ) {

            prefs.edit()
                    .putLong(
                            AttendanceWidget.KEY_PUNCH_OUT,
                            System.currentTimeMillis()
                    )
                    .apply();
        }


        AttendanceWidget.refreshAllWidgets(
                this
        );
    }


    /*
     * =========================================================
     * UPDATE LIVE NOTIFICATION
     * =========================================================
     */

    private void updateNotification() {

        if (!isAttendanceActive()) {

            stopAttendanceService();
            return;
        }


        NotificationManager manager =
                (NotificationManager)
                        getSystemService(
                                NOTIFICATION_SERVICE
                        );


        if (manager != null) {

            try {

                manager.notify(
                        NOTIFICATION_ID,
                        buildNotification()
                );

            } catch (Exception e) {

                e.printStackTrace();
            }
        }
    }


    /*
     * =========================================================
     * BUILD NOTIFICATION
     * =========================================================
     */

    private Notification buildNotification() {

        SharedPreferences prefs =
                getSharedPreferences(
                        AttendanceWidget.PREFS,
                        MODE_PRIVATE
                );


        long punchIn =
                prefs.getLong(
                        AttendanceWidget.KEY_PUNCH_IN,
                        0
                );


        /*
         * Punch In time.
         */
        SimpleDateFormat timeFormat =
                new SimpleDateFormat(
                        "hh:mm a",
                        Locale.getDefault()
                );


        String punchInText =
                punchIn > 0
                        ? timeFormat.format(
                                new Date(punchIn)
                        )
                        : "--:--";


        /*
         * Calculate live working duration.
         */
        long difference = 0;


        if (punchIn > 0) {

            difference =
                    Math.max(
                            0,
                            System.currentTimeMillis()
                                    - punchIn
                    );
        }


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


        /*
         * =====================================================
         * OPEN APP
         * =====================================================
         */

        Intent openIntent =
                new Intent(
                        this,
                        MainActivity.class
                );


        openIntent.setFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                        Intent.FLAG_ACTIVITY_CLEAR_TOP
        );


        PendingIntent openPendingIntent =
                PendingIntent.getActivity(
                        this,
                        201,
                        openIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT |
                                PendingIntent.FLAG_IMMUTABLE
                );


        /*
         * =====================================================
         * NOTIFICATION PUNCH OUT
         * =====================================================
         *
         * Send Punch Out to AttendanceWidget.
         * The widget receiver saves Punch Out,
         * stops this service and refreshes widget.
         */

        Intent punchOutIntent =
                new Intent(
                        this,
                        AttendanceWidget.class
                );


        punchOutIntent.setAction(
                AttendanceWidget.ACTION_PUNCH_OUT
        );


        PendingIntent punchOutPendingIntent =
                PendingIntent.getBroadcast(
                        this,
                        202,
                        punchOutIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT |
                                PendingIntent.FLAG_IMMUTABLE
                );


        String content =
                "Punch In: "
                        + punchInText
                        + " • Working: "
                        + workingTime;


        /*
         * =====================================================
         * NOTIFICATION
         * =====================================================
         */

        return new NotificationCompat.Builder(
                this,
                CHANNEL_ID
        )

                .setSmallIcon(
                        R.drawable.icon_512
                )

                .setContentTitle(
                        "SELF HRMS • ● Working"
                )

                .setContentText(
                        content
                )

                .setStyle(
                        new NotificationCompat
                                .BigTextStyle()
                                .bigText(
                                        "● Working"
                                                + "\nPunch In: "
                                                + punchInText
                                                + "\nWorking Time: "
                                                + workingTime
                                )
                )

                .setContentIntent(
                        openPendingIntent
                )

                .setOngoing(
                        true
                )

                .setOnlyAlertOnce(
                        true
                )

                .setSilent(
                        true
                )

                .setPriority(
                        NotificationCompat.PRIORITY_LOW
                )

                .setCategory(
                        NotificationCompat.CATEGORY_SERVICE
                )

                .addAction(
                        0,
                        "PUNCH OUT",
                        punchOutPendingIntent
                )

                .build();
    }


    /*
     * =========================================================
     * CREATE NOTIFICATION CHANNEL
     * =========================================================
     */

    private void createNotificationChannel() {

        if (
                Build.VERSION.SDK_INT
                        >= Build.VERSION_CODES.O
        ) {

            NotificationChannel channel =
                    new NotificationChannel(
                            CHANNEL_ID,
                            "Live Attendance",
                            NotificationManager.IMPORTANCE_LOW
                    );


            channel.setDescription(
                    "Shows active SELF HRMS attendance"
            );


            channel.setSound(
                    null,
                    null
            );


            NotificationManager manager =
                    getSystemService(
                            NotificationManager.class
                    );


            if (manager != null) {

                manager.createNotificationChannel(
                        channel
                );
            }
        }
    }


    /*
     * =========================================================
     * STOP SERVICE SAFELY
     * =========================================================
     */

    private void stopAttendanceService() {

        if (handler != null) {

            handler.removeCallbacks(
                    timerRunnable
            );
        }


        if (foregroundStarted) {

            if (
                    Build.VERSION.SDK_INT
                            >= Build.VERSION_CODES.N
            ) {

                stopForeground(
                        STOP_FOREGROUND_REMOVE
                );

            } else {

                stopForeground(
                        true
                );
            }


            foregroundStarted =
                    false;
        }


        stopSelf();
    }


    /*
     * =========================================================
     * SERVICE DESTROYED
     * =========================================================
     */

    @Override
    public void onDestroy() {

        if (handler != null) {

            handler.removeCallbacks(
                    timerRunnable
            );
        }


        super.onDestroy();
    }


    /*
     * =========================================================
     * BIND
     * =========================================================
     */

    @Override
    public IBinder onBind(
            Intent intent
    ) {

        return null;
    }
}
