"use strict";

// __________ Main class __________
class Aplicatie {
    constructor() {
        // - Get the running context
        if("nw" in window) {
            this.context = "nw";
        } else {
            this.context = "browser";
        }

        // - Load data
        this.settings = Settings.load(this.context);
        let data_notes = localStorage.getItem("notes");
        let data_backlog = localStorage.getItem("backlog");
        let data_session = localStorage.getItem("session");

        if(data_notes)
            setTimeout(() => {JSON.parse(DataFormat.jsonEscape(data_notes)).notes.forEach(item => aplicatie.notes.add(item)); data_notes = null;}, 100);
        if(data_backlog)
            setTimeout(() => {JSON.parse(DataFormat.jsonEscape(data_backlog)).backlog.forEach(item => aplicatie.backlog.add(item)); data_backlog = null;}, 100);
        if(data_session) {
            setTimeout(() => {JSON.parse(DataFormat.jsonEscape(data_session)).session.forEach(item => aplicatie.tasks.createTask(item))}, 100);
            setTimeout(() => {
                let i = 0; 
                JSON.parse(DataFormat.jsonEscape(data_session)).session.forEach(item => {
                    aplicatie.tasks.updateTask(i, item);
                    if(item.task.state == "done") {
                        aplicatie.tasks.order.complete(parseInt(i));
                    }
                    i++;
                }); 
                data_session = null;
            }, 200);
        }

        // - Initialize components
        this.clock = new Clock();
        this.tasks = new TaskController([], this);
        this.backlog = new Backlog(null);
        this.notes = new Notes(null);
        this.review = new Review();
        this.notifications = new Notifications(this.context);
        this.pomodoro = new Pomodoro({duration:{work: this.settings.pomodoro.w_duration, break: this.settings.pomodoro.b_duration}}, this);
        this.gui = new GUI(this);

        this.state = "planificare";
    }

    changeState(state) {
        this.state = state;
        switch (state) {
            case "planificare":
                this.tasks.changeState(state);
                this.gui.changeState(state);
                break;
            case "work":
                if(aplicatie.settings.pomodoro.fixed_nr)
                    if(!this.gui.fixedNrDialog())
                        break;

                this.pomodoro.start();
                this.gui.changeState(state);
                this.tasks.changeState(state);
                break;
            case "review":
                this.pomodoro.end();
                this.tasks.changeState(state);
                this.gui.changeState(state);
                break;
            default:

        }
    }

    quit(saveSession = false) {
        // save task state
        if(saveSession) {
            localStorage.setItem("session", JSON.stringify({session: this.tasks.getAll()}));    
        }

        // save notes & backlog
        localStorage.setItem("notes", JSON.stringify({notes: this.notes.getAll()}));
        localStorage.setItem("backlog", JSON.stringify({backlog: this.backlog.getAll()}));
        switch(this.context) {
            case "browser":
                location.reload();
                break;
            case "nw":
                nw.Window.get().close(true);
                break;
        }
    }
}

// __________ Main Helpers __________
// ### Clock ###
class Clock {
    constructor() {
        this.listenerColection = new Set();
        this.interval = setInterval(() => {
            this.tick();
        }, 1000);
        this.paused = false;
    }

    tick() {
        for (const listener of this.listenerColection) {
            if(!listener.paused) {
                listener.tick();
            }
        }
    }

    register(listener) {
        this.listenerColection.add(listener);
    }

    remove(listener) {
        this.listenerColection.delete(listener);
        listener = null;
    }
}

// ### Data Format ###
class DataFormat {
    static time(time = 0) {
        let sec = time % 60;
        let min = Math.floor(time / 60);
        let hours = Math.floor(min / 60);
        let result = (min % 60).toString().padStart(2, "0") + ":" + sec.toString().padStart(2, "0");
        if(hours) {
            result = hours.toString().padStart(2, "0") + ":" + result;
        }
        return result;
    }

    static jsonEscape(str)  {
        return str.replace(/\n/g, "\\\\n").replace(/\r/g, "\\\\r").replace(/\t/g, "\\\\t");
    }
}
