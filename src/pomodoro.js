// __________ Pomodoro - Controller __________
class Pomodoro {
    constructor(data, aplicatie) {
        this.aplicatie = aplicatie;
        this.view = new PomodoroView(this);

        this.state = "idle"; // idle, work, break, finished
        this.paused = true;
        this.nr = 0;
        this.duration = {
            work: data.duration.work,
            break: data.duration.break
        }

        if(aplicatie.settings.sounds.sound_workbreak)
            this.audio = new Audio("res/audio/deskbell.wav");
        else
            this.audio = {play: function() {return false}};
    }

    start() {
        this.state = "work";
        this.paused = false;
        this.timer = new PomoTimer(this.duration[this.state], this.state, this);
        this.view.toggleState();
        this.view.createTimer();
        this.aplicatie.clock.register(this);
    }

    togglePause() {
        this.paused = !this.paused;
        this.view.toggleState();
        this.aplicatie.tasks.togglePaused();
    }

    tick() {
        this.view.updateTime();
        this.timer.tick();
        if(this.timer.done == true) {
            this.state = (this.state == "work") ? "break" : "work";
            this.nr -= (this.state == "work") ? 1 : 0;
            this.aplicatie.tasks.paused = (this.state == "work") ? false : true;

            this.timer = new PomoTimer(this.duration[this.state], this.state, this);
            this.view.createTimer();
            this.audio.play();
            aplicatie.notifications.notify(this.state);
        }

        if(this.nr == 0 && aplicatie.settings.pomodoro.fixed_nr)  {
            aplicatie.changeState("review");
            aplicatie.gui.popup.show("Planned time has ended");
        }
    }

    end() {
        this.state = "finished";
        this.aplicatie.clock.remove(this);
        this.view.finish();
    }
}

// __________ Pomodoro - View __________
class PomodoroView {
    constructor(controller) {
        this.controller = controller;
        this.parent = document.getElementById("pomodoro");

        this.buttonPress = (function(e) {
            switch (this.controller.state) {
                case "idle":
                    aplicatie.changeState("work");
                    break;
                case "work":
                case "break":
                    this.controller.togglePause();
                    break;
            }
        }).bind(this);

        this.parent.addEventListener("click", this.buttonPress);
    }

    createTimer() {
        this.parent.className = `pomodoro ${this.controller.state}`;

        let times = document.querySelector("header .pomodoro .time");
        times.innerText = DataFormat.time(this.controller.timer.duration);

        this.parent.removeChild(document.querySelector("header .pomodoro .animation"));
        let newAnimation = document.createElement("div");
        newAnimation.className = "animation";
        this.parent.appendChild(newAnimation);

        this.parent.removeChild(document.querySelector("header .pomodoro .statusIcon"));
        let statusIcon = document.createElement("i");
        statusIcon.className = (this.controller.state == "work") ? "statusIcon fas fa-clock" : "statusIcon fas fa-coffee";
        this.parent.appendChild(statusIcon);

        times = newAnimation = statusIcon = null;
    }

    updateTime() {
        document.querySelector("header .pomodoro .time").innerText = DataFormat.time(this.controller.timer.duration);
        document.querySelector("header .pomodoro .animation").style.right = `${((this.controller.timer.duration - 1) / this.controller.duration[this.controller.state]) *100}%`;

        if(aplicatie.settings.tray.enable_tray && aplicatie.context == "nw") {
            aplicatie.gui.appWindow.updateTime(this.controller.state, DataFormat.time(this.controller.timer.duration));
        }
    }

    toggleState() {
        let toggleState = document.querySelector("header .pomodoro .toggleState");
        this.parent.removeChild(toggleState);
        toggleState = document.createElement("i");
        switch (this.controller.state) {
            case "idle":
                this.parent.className = "pomodoro";
                toggleState.className = "toggleState fas fa-pause";
                break;
            case "work":
            case "break":
                toggleState.className = (this.controller.paused) ? "toggleState fas fa-play" : "toggleState fas fa-pause";
                if(aplicatie.settings.tray.enable_tray && aplicatie.context == "nw") {
                    aplicatie.gui.appWindow.togglePause(this.controller.paused);
                }
                break;
        }
        this.parent.appendChild(toggleState);
        toggleState = null;
    }

    finish() {
        this.parent.className = `pomodoro ${this.controller.state}`;
    }
}

// __________ Pomodoro - Timer __________
class PomoTimer {
    constructor(duration, mode, controller) {
        this.controller = controller;

        this.duration = duration;
        this.mode = mode;
        this.done = false;

        if(this.mode == "break" && aplicatie.settings.break.enable_break) {
            this.break = new Break(duration);
        }

        //TODO: add settings to disable applet
        if(this.mode == "work") {
            this.applet = new Applet(duration);
        }
    }

    tick() {
        this.duration--;
        this.timeHooks(this.duration);
        if(this.break) {
            this.break.tick();
        }

        if(this.applet) {
            this.applet.tick();
        }
    }

    timeHooks(time) {
        switch (time) {
            case -1:
                this.done = true;
                if(this.break) {
                    this.break.destroy();
                    this.break = null;
                }

                if(this.applet) {
                    this.applet.destroy();
                    this.applet = null;
                }
                break;
            case 600:
            case 30:
                aplicatie.notifications.notify("remaining", time);
                break;
        }
    }
}
