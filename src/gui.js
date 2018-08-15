// __________ G U I - main view __________
class GUI {
    constructor(aplicatie) {
        this.aplicatie = aplicatie;
        
        // Initialize components
        this.dialogs = new Dialog();
        this.popup = new Popup();
        setTimeout(() => {
            if(aplicatie.context == "nw") {
                this.appWindow = new AppWindow();
            }
        }, 10);
        setTimeout(() => {this.navigator = new Navigator(this);}, 10);
    }

    changeState(state) {
        this.navigator.changeState(state);
        if(aplicatie.context == "nw")
            this.appWindow.changeStrate(state);

        document.querySelector("section.main").className = `main ${state}`;
    }

    fixedNrDialog() {
        let number = false;
        while((isNaN(number) || !number) && number != null) {
            number = prompt("How many pomodoros do you want to work today?");
        }

        if(number == null || number == "") {
            return false;
        }

        if(number > aplicatie.settings.pomodoro.max_pomodoro_per_day &&
        aplicatie.settings.pomodoro.max_pomodoro_per_day != -1) {
            number = aplicatie.settings.pomodoro.max_pomodoro_per_day;
            aplicatie.gui.popup.show(`Set the maximum of ${number} pomodoros`);
        }
        if(number < 1) {
            number = 1;
        }
        aplicatie.pomodoro.nr = parseInt(number);
        return true;
    }

    maximize() {
        if(aplicatie.context == "nw") {
            this.appWindow.window.maximize();
        }
    }
}

// __________ G U I - main view components __________
// ### App Window ###
class AppWindow {
    constructor() {
        this.window = nw.Window.get();

        // - Set menubar (macOs only)
        if(process.platform == "darwin") {
            let menubar = new nw.Menu({type: "menubar"});
            menubar.createMacBuiltin("Planner");
            menubar.items[0].submenu.insert(new nw.MenuItem({type: "separator"}), 1);
            menubar.items[0].submenu.insert(new nw.MenuItem({type: "normal", label: "Preferences", key: ",", modifiers: "cmd", click: () => aplicatie.gui.dialogs.create(settings, aplicatie.settings)}), 2);
            menubar.items[0].submenu.insert(new nw.MenuItem({type: "separator"}), 3);

            this.window.menu = menubar;
        }

        // - Set tray
        if(aplicatie.settings.tray.enable_tray) {
            this.window.on("close", (quit) => {if(quit == "quit") {aplicatie.quit()} else {this.window.hide()}});

            this.tray = new nw.Tray({title:"", tooltip: "Planner"});

            // right-click menu
            let menu = new nw.Menu();
            menu.append(new nw.MenuItem({type: 'normal', label: "Start", click: () => aplicatie.changeState("work")}));
            menu.append(new nw.MenuItem({type: 'normal', label: "Show", click: () => this.window.show()}));
            menu.append(new nw.MenuItem({type: 'normal', label: "Exit", click: () => aplicatie.quit()}));
            this.tray.menu = menu;

            // set icon
            this.trayIconName = (process.platform == "darwin") ? "res/img/status_icons/mac-" : "res/img/status_icons/";
            if(aplicatie.settings.tray.dark_icons && process.platform != "darwin") {
                this.trayIconName = "res/img/status_icons/dark-";
            }
            this.tray.icon = this.trayIconName + "planner.png";

            this.tray.on("click", () => this.window.show());
        }
    }

    changeStrate(state) {
        switch(state) {
            case "work":
                this.tray.menu.removeAt(0);
                this.tray.menu.insert(new nw.MenuItem({type: "checkbox", label: "Pause", click: () => aplicatie.pomodoro.togglePause()}), 0);
                aplicatie.gui.appWindow.tray.menu = this.tray.menu;

                this.tray.icon = this.trayIconName + "clock.png";
                this.tray.tooltip = "work";
                break;
            case "review":
                this.tray.menu.removeAt(0);
                this.tray.menu.insert(new nw.MenuItem({type: "normal", label: "Finish", click: () => aplicatie.review.finish()}));
                aplicatie.gui.appWindow.tray.menu = this.tray.menu;

                this.tray.icon = this.trayIconName + "planner.png";
                this.tray.tooltip = "Planner - Review";

                this.window.focus();
                break;
        }
    }

    // Tray functions
    updateTime(mode, time) {
        // - update icon
        if(this.tray.icon != this.trayIconName + mode + ".png")
            this.tray.icon = this.trayIconName + mode + ".png";

        // - update tooltip
        this.tray.tooltip = mode + " - " + time;

        // - update time (effect only on macOs)
        if(aplicatie.settings.tray.show_time) {
            if(mode != "idle")
                this.tray.title = time;
        }
    }

    togglePause(pause) {
        try {
            this.tray.menu.items[0].checked = pause;
        } catch (error) {
            // ignoring error when the first item doesn't have checked property
        }
        aplicatie.gui.appWindow.tray.menu = this.tray.menu;

        if(pause) {
            this.tray.icon = this.trayIconName + "idle.png";
        }
    }
}

// ### Navigator ###
class Navigator {
    constructor(controller) {
        this.controller = controller
        this.navigator = document.getElementById("navigator");
        this.navigator.addEventListener("click", this.callback);
    }

    callback(e) {
        let className, i;
        let element = e.target;
        for(element; element.tagName != "html"; element = element.parentNode) {
            ["addTask","settings","review","finish"].forEach(classa => {
                if(element.classList.contains(classa)) {
                    className = classa;
                }
            });
            if(className != undefined)
                break;
        }

        switch (className) {
            case "addTask":
                aplicatie.gui.dialogs.create(addTask, undefined);
                break;
            case "settings":
                aplicatie.gui.dialogs.create(settings, aplicatie.settings);
                break;
            case "review":
                aplicatie.changeState("review");
                break;
            case "finish":
                aplicatie.quit();
                break;
        }
        element = className = i = null;
    }

    changeState(state) {
        switch (state) {
            case "planificare":
                document.querySelector("header .navigator div.addTask").classList.remove("rmv");
                document.querySelector("header .navigator div.review").classList.add("rmv");
                document.querySelector("header .navigator div.finish").classList.add("rmv");
                break;
            case "work":
                document.querySelector("header .navigator div.addTask").classList.remove("rmv");
                document.querySelector("header .navigator div.review").classList.remove("rmv");
                document.querySelector("header .navigator div.finish").classList.add("rmv");
                break;
            case "review":
                document.querySelector("header .navigator div.addTask").classList.add("rmv");
                document.querySelector("header .navigator div.review").classList.add("rmv");
                document.querySelector("header .navigator div.finish").classList.remove("rmv");
                break;
        }
    }
}

// ### Popup ###
class Popup {
    constructor() {
        this.parent = document.getElementsByClassName("popup")[0];
        document.querySelector("div.popup .close").addEventListener("click", () => this.close());
    }

    show(message) {
        this.close();
        document.querySelector("div.popup .text").innerText = message;
        this.parent.className = "popup";
    }

    close() {
        this.parent.className = "popup hidden";
    }
}