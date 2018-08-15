// __________ Settings __________
class Settings {
    static load() {
        let def = {
            pomodoro: {
                w_duration: 3000,
                b_duration: 600,
                fixed_nr: false,
                max_pomodoro_per_day: -1
            },
            workflow: {
                autostart_first: true,
                autostart_next: true
            },
            notifications: {
                show_not: true,
                show_not_tasktimeout: true,
            },
            sounds: {
                sound_workbreak: true,
                sound_tasktimeout: true,
            },
            tray: {
                enable_tray: true,
                show_time: true
            },
            break: {
                enable_break: true,
                restrictedMode: false,
                dark_icons: false
            }
        }

        let settings = localStorage.getItem("settings");
        try {
            settings = JSON.parse(settings);
        } catch (err) {
            settings = def;
            console.warn("Malformed settings string");
            console.warn(err);
        }

        if(!settings) {
            settings = def;
        }
        return settings;
    }

    static set(data) {
        localStorage.setItem("settings", JSON.stringify(data));

        aplicatie.settings = data;
        aplicatie.pomodoro.audio = (data.sounds.sound_workbreak) ? new Audio("res/audio/deskbell.wav") : {play: function() {return false}};
        aplicatie.tasks.audio = (data.sounds.sound_tasktimeout) ? new Audio("res/audio/definite.mp3") : {play: function() {return false}};
        aplicatie.pomodoro.duration.work = data.pomodoro.w_duration;
        aplicatie.pomodoro.duration.break = data.pomodoro.b_duration;
    }
}