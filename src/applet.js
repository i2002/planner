class Applet {
    constructor(workduration) {
        this.time = workduration;
        this.newApplet();
    }

    newApplet() {
        if(aplicatie.context == "nw") {
            nw.Window.open(`applet.html`, {width: 120, height: 120, always_on_top: true, frame: false, visible_on_all_workspaces: true, transparent: true, show_in_taskbar: false, show: false}, window => {
                this.window = window;

                window.on("loaded", () => window.eval(null, `let appletfront = new AppletFront(${this.time})`));

                window.window.addEventListener("details", () => {
                    this.showDetails();
                })

                //TODO: add settings to disable auto showing up
                window.on("minimize", () => {
                    window.restore();
                })

                window.on("closed", () => {
                    this.window = null;
                    if(this.time > 0) {
                        this.newApplet();
                    }
                });
            })
        }
    }

    // implement applet show details
    showDetails() {
        
    }

    tick() {
        if(this.time == 0) {
            this.destroy();
        }
        this.time--;

        if(this.window) {
            switch (aplicatie.context) {
                case "nw":
                    this.window.eval(null, "appletfront.tick()");
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