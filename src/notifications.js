// __________ Notifications __________
class Notifications {
    constructor(context) {
        if(context == "nw" && process.platform == "linux") {
            this.notifications = require("freedesktop-notifications");
        }
    }

    notify(presetName, data) {
        if(!aplicatie.settings.notifications.show_not)
            return;

        let preset = this.getPreset(presetName, data);

        if(aplicatie.context == "nw" && process.platform == "linux") {
            this.notifications.createNotification({summary: preset.title, body: preset.body, icon: process.cwd() + "/res/img/planner.png"}).push();
        } else {
            let notification = new Notification(preset.title, {body: preset.body, icon: "res/img/planner.png"});
        }

        if(Notification.permission !== "granted") {
            aplicatie.gui.popup.show("To show notifications select the 'Request Permission' button in Settings");
        }
        preset = null;
    }

    getPreset(presetName, data) {
        let presets = {
            "break": {
                body: "Take a break!"
            },
            "work": {
                body: "Focus on your tasks!"
            },
            "remaining": {
                body: `${(data > 60) ? `${Math.floor(data / 60)} minutes` : `${data} seconds`} remaining`
            },
            "tasktimeout": {
                title: data,
                body: `Time's up!`
            },
            "default": {
                title: "Planner",
                body: "This is a demo message",
            }
        }

        let preset = presets[presetName];
        let result = {};

        for (let key in presets.default) {
            result[key] = (preset[key]) ? preset[key] : presets.default[key];
        }

        return result;
    }
}
