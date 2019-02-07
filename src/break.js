class Break {
    constructor(breakduration) {
        this.time = breakduration;
        this.newWindow();
    }

    newWindow() {
        switch (aplicatie.context) {
            case "nw":
                nw.Window.open(`break.html`, {}, window => {
                    this.window = window;
                    window.enterFullscreen();

                    window.on("loaded", () => window.eval(null, `let breakfront = new BreakFront(${this.time},"${aplicatie.context}", ${aplicatie.settings.break.restrictedMode})`));
                    window.on("blur", () => {
                        if(aplicatie.settings.break.restrictedMode) {
                            window.focus();
                        }
                    });

                    window.window.addEventListener("close", () => {
                        window.close();
                    })

                    window.window.addEventListener("pauseplay", () => {
                        aplicatie.pomodoro.togglePause();
                    })

                    window.on("closed", () => {
                        this.window = null;
                        if(this.time > 0 && aplicatie.settings.break.restrictedMode) {
                            this.newWindow();
                        }
                    });
                })
                break;
        }
    }

    tick() {
        if(this.time == 0) {
            this.destroy();
        }
        this.time--;

        if(this.window) {
            switch (aplicatie.context) {
                case "nw":
                    this.window.eval(null, "breakfront.tick()");
                    break;
            }
        }
    }

    destroy() {
        if(this.window) {
            if(aplicatie.context == "nw") {
                this.window.removeAllListeners(["blur", "closed", "loaded"]);
                this.window.close();
            }
        }
    }
}
