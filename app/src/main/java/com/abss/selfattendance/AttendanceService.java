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

    private static final int NOTIFICATION_ID = 1001;

    private final Handler handler =
            new Handler(Looper.getMainLooper());

    private final Runnable timerRunnable =
            new Runnable() {
                @Override
                public void run() {

                    updateNotification();

                    // Also refresh widget working time.
                    AttendanceWidget.refreshAllWidgets(
                            AttendanceService.this
                    );

                    handler.postDelayed(
                            this,
                            1000
                    );
                }
            };


    @Override
    public void onCreate() {
        super.onCreate();

        createNotificationChannel();
    }


    @Override
    public int onStartCommand(
            Intent intent,
            int flags,
            int startId
    ) {

        String action =
                intent != null
                        ? intent.getAction()
                        : null;


        /*
         * PUNCH OUT from notification/service.
         */
        if (ACTION_STOP.equals(action)) {

            completePunchOut();

            handler.removeCallbacks(
                    timerRunnable
            );

            stopForeground(true);
            stopSelf();

            return START_NOT_STICKY;
        }


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


        /*
         * Nothing active, so service does not need
         * to keep running.
         */
        if (punchIn <= 0 || punchOut > 0) {

            stopSelf();
            return START_NOT_STICKY;
        }


        /*
         * Android requires foreground service to
         * display its notification immediately.
         */
        startForeground(
                NOTIFICATION_ID,
                buildNotification()
        );


        handler.removeCallbacks(
                timerRunnable
        );

        handler.post(
                timerRunnable
        );


        return START_STICKY;
    }


    /*
     * Save Punch OUT when user taps the
     * notification PUNCH OUT action.
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


        if (punchIn > 0 && punchOut == 0) {

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


    private void updateNotification() {

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


        /*
         * Attendance was completed elsewhere,
         * for example from the widget.
         */
        if (punchIn <= 0 || punchOut > 0) {

            handler.removeCallbacks(
                    timerRunnable
            );

            stopForeground(true);
            stopSelf();

            return;
        }


        NotificationManager manager =
                (NotificationManager)
                        getSystemService(
                                NOTIFICATION_SERVICE
                        );


        if (manager != null) {

            manager.notify(
                    NOTIFICATION_ID,
                    buildNotification()
            );
        }
    }


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
         * Punch IN display time.
         */
        SimpleDateFormat format =
                new SimpleDateFormat(
                        "hh:mm a",
                        Locale.getDefault()
                );

        String punchInText =
                punchIn > 0
                        ? format.format(new Date(punchIn))
                        : "--:--";


        /*
         * Working duration.
         */
        long difference =
                punchIn > 0
                        ? Math.max(
                                0,
                                System.currentTimeMillis()
                                        - punchIn
                        )
                        : 0;


        long totalSeconds =
                difference / 1000;

        long hours =
                totalSeconds / 3600;

        long minutes =
                (totalSeconds % 3600) / 60;

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
         * Open app.
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
         * Notification Punch OUT action.
         */
        Intent punchOutIntent =
                new Intent(
                        this,
                        AttendanceService.class
                );

        punchOutIntent.setAction(
                ACTION_STOP
        );


        PendingIntent punchOutPendingIntent =
                PendingIntent.getService(
                        this,
                        202,
                        punchOutIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT |
                                PendingIntent.FLAG_IMMUTABLE
                );


        String content =
                "Punch In: "
                        + punchInText
                        + "  •  Working: "
                        + workingTime;


        return new NotificationCompat.Builder(
                this,
                CHANNEL_ID
        )
                .setContentTitle(
                        "SELF HRMS • ● Working"
                )
                .setContentText(content)
                .setStyle(
                        new NotificationCompat.BigTextStyle()
                                .bigText(
                                        "● Working\n"
                                                + "Punch In: "
                                                + punchInText
                                                + "\nWorking Time: "
                                                + workingTime
                                )
                )
                .setSmallIcon(
                        R.drawable.icon_512
                )
                .setContentIntent(
                        openPendingIntent
                )
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setSilent(true)
                .setPriority(
                        NotificationCompat.PRIORITY_LOW
                )
                .addAction(
                        0,
                        "PUNCH OUT",
                        punchOutPendingIntent
                )
                .build();
    }


    private void createNotificationChannel() {

        if (Build.VERSION.SDK_INT
                >= Build.VERSION_CODES.O) {

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


    @Override
    public void onDestroy() {

        handler.removeCallbacks(
                timerRunnable
        );

        super.onDestroy();
    }


    @Override
    public IBinder onBind(
            Intent intent
    ) {
        return null;
    }
              }
