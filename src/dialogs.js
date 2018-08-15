// __________ Dialog - Controller __________
class Dialog {
    constructor() {
        this.callbacks = {
            input:function(e) {
                if (!e) {
                    e = window.event;
                }

                if (e.keyCode == 13 && e.target.value != "" && e.target.tagName.toLowerCase() != "textarea") {
                    aplicatie.gui.dialogs.buttonHandler(aplicatie.gui.dialogs.view.preset.submit, true, true);
                }
                if (e.keyCode == 27) {
                    aplicatie.gui.dialogs.view.close();
                }
            },
            buttons:function(e) {
                let id = e.target.id;
                let i = 0;
                let preset = aplicatie.gui.dialogs.view.preset;
                for(i = 0; i < preset.buttons.length && id != preset.buttons[i].id; i++);
                if(id != "submit")
                    aplicatie.gui.dialogs.buttonHandler(preset.buttons[i].callback, preset.buttons[i].close, preset.buttons[i].validate)
                else
                    aplicatie.gui.dialogs.buttonHandler(preset.submit, true, true);
                id = i = preset = null;
            },
            close:function(e) {
                aplicatie.gui.dialogs.view.close();
            }
        }
    }

    create(preset, data, id) {
        // merge preset values with data if data exists
        this.id = id;
        if(data) {
            let i=0, j=0;
            preset.content.forEach(subtitle => {
                subtitle.content.forEach(item => {
                    switch (item.type) {
                        case "group":
                            let values = item.reverseFormula(data[preset.content[i].subtitle_id][item.id]);
                            for(let x = 0, y = 0; x < values.length && y < item.content.length; y++)
                                if(item.content[y].type != "separator")
                                    item.content[y].value = values[x++];
                            values = null;
                            break;
                        case "checkbox":
                            if(data[preset.content[i].subtitle_id][item.id]) {
                                item.checked = "true";
                            }
                        default:
                            item.value = data[preset.content[i].subtitle_id][item.id];
                    }
                    j++;
                })
                i++;
            })
        }
        this.preset = preset;
        this.view = new DialogView(preset, this);
    }

    // get data object from dialog input
    get parseData() {
        let data = {};
        let id = 0;
        this.preset.content.forEach(subtitle => {
            data[subtitle.subtitle_id] = {};
            subtitle.content.forEach(item => {
                data[subtitle.subtitle_id][item.id] = this.parseInput(item);
            })
            id++;
        })
        return data;
    }

    parseInput(item) {
        let result;
        switch (item.type) {
            case "group":
                let values = [];
                item.content.forEach(groupitem => {
                    if(groupitem.type != "separator")
                        values.push(this.parseInput(groupitem));
                });
                result = item.formula(values);
                break;
            case "text":
            case "textarea":
                result = document.getElementById(item.id).value;
                break;
            case "number":
                result = parseInt(document.getElementById(item.id).value);
                break;
            case "checkbox":
                result = document.getElementById(item.id).checked;
                break;
            default:

        }
        return result;
    }

    // check if all fields have the corect type of data inputed
    validateInput() {
        let id = 0;
        let res = true;
        this.preset.content.forEach(subtitle => {
            subtitle.content.forEach(item => {
                if(!this.validateItem(item))
                    res =  false;
            })
            id++;
        })
        return res;
    }

    validateItem(item) {
        switch(item.type) {
            case "group":
                let res = true;
                item.content.forEach(groupitem => {
                    if(!this.validateItem(groupitem))
                        res = false;
                })
                return res;
                break;
            case "number":
                if(Number.isNaN(document.getElementById(item.id).value) || document.getElementById(item.id).value == "") {
                    document.getElementById(item.id).classList.add("wrong");
                    return false;
                }
                break;
            case "text":
            case "textarea":
                if(document.getElementById(item.id).value == "") {
                    document.getElementById(item.id).classList.add("wrong");
                    return false;
                }
                break;
        }
        if(item.id)
            document.getElementById(item.id).classList.remove("wrong");
        return true;
    }

    buttonHandler(callback, close, parse) {
        if(parse) {
            if(this.validateInput()) {
                let data = this.parseData;
                callback(data, this.id);
            } else {
                return -1;
            }
        } else {
            callback(undefined, this.id);
        }
        if(close) {
            this.view.close();
            this.view = null;
            this.preset = null;
        }
    }
}

// __________ Dialog - View __________
class DialogView {
    constructor(preset, controller) {
        this.preset = preset;
        this.controller = controller;
        this.createElement();
    }
    
    createElement() {
        let preset = this.preset;

        // create parent element
        let container = document.createElement("div");
        container.classList.add("dialog");
        this.container = container;

        let dialog = document.createElement("div");
        dialog.classList.add("content");

        // create head
        let head = document.createElement("div");
        head.classList.add("head");

        // - set title
        let title = document.createElement("h1");
        title.innerText = preset.title;
        let close = document.createElement("div");
        close.classList.add("close");
        close.innerText = "\u00D7";

        head.appendChild(title);
        head.appendChild(close);
        container.appendChild(head);

        // - set width to 0 for fadein animation
        head.style.width = 0;
        dialog.style.width = 0;
        container.style.opacity = 0;
        setTimeout(() => {dialog.style.width=null;container.style.opacity=null; head.style.width=null}, 10);

        // create subtitles
        for (let subtitle of preset.content) {
            let section = document.createElement("section");
            let form = document.createElement("form");
            form.setAttribute("class", "dialog_form");
            section.appendChild(form);

            // create subtitle text (only if preset.content.length > 1)
            if(preset.content.length > 1) {
                let subtitleName = document.createElement("h2");
                subtitleName.innerText = subtitle["subtitle"];
                section.appendChild(subtitleName);
            }
            for (let item of subtitle.content) {
                this.createItem(item, section);
            }
            dialog.appendChild(section);
        }

        // create buttons
        let buttonsGroup = document.createElement("div");
        buttonsGroup.classList.add("buttons");
        //buttonsGroup.addEventListener("click", this.controller.callbacks.buttons)
        for (let button of preset.buttons) {
            // create button
            let element = document.createElement("input");
            for(let key in button) {
                if(key != "callback" && key != "close" && key != "validate")
                    element.setAttribute(key, button[key]);
            }
            buttonsGroup.appendChild(element);
        }

        dialog.appendChild(buttonsGroup);
        container.appendChild(dialog);
        document.getElementsByTagName("body")[0].appendChild(container);

        // set event listeners
        document.querySelector("div.dialog div.content").addEventListener("keyup", this.controller.callbacks.input);
        document.querySelector("div.dialog div.buttons").addEventListener("click", this.controller.callbacks.buttons);
        document.querySelector("div.dialog div.close").addEventListener("click", this.controller.callbacks.close);

        setTimeout( () => { preset = head = dialog = title = close = buttonsGroup = null;}, 60);
    }

    createItem(item, parent) {
        switch (item.type) {
            case "group":
                let label = document.createElement("label");
                label.innerText = item.label;
                parent.appendChild(label);

                let group = document.createElement("div");
                group.classList.add("group");
                group.setAttribute("id", item.id);

                item.content.forEach(groupitem => this.createItem(groupitem, group));

                parent.appendChild(group);
                label = group = null;
                break;  
            case "separator":
                let span = document.createElement("span");
                span.innerText = item.value;
                parent.appendChild(span);
                span = null;
                break;
            default:
                this.createInput(item, parent);
        }
    }

    createInput(item, parent) {
        // create input
        let input;
        if(item.type == "textarea") {
            input = document.createElement("textarea");
            if(item.value) {
                input.innerHTML = item.value;
            }
        } else {
            input = document.createElement("input")
        }
        for(let key in item) {
            switch (key) {
                case "label":
                    let label = document.createElement("label");
                    label.innerText = item.label;
                    parent.appendChild(label);
                    break;
                case "autofocus":
                    setTimeout(() => {input.focus(); input = null}, 500);
                    break;
                default:
                    input.setAttribute(key, item[key]);
            }
        }
        parent.appendChild(input);
        let br = document.createElement("br");
        parent.appendChild(br);

        if(!item.autofocus)
            input = null;
    }

    close() {
        document.querySelector(".dialog .content").removeEventListener("keyup", this.controller.callbacks.input);
        document.querySelector(".dialog .buttons").removeEventListener("click", this.controller.callbacks.buttons);
        document.querySelector(".dialog .close").removeEventListener("click", this.controller.callbacks.close);

        this.controller = null;
        this.preset = null;

        document.querySelector(".dialog .content").style.width=0;
        document.querySelector(".dialog .head").style.width=0;

        this.container.style.opacity = 0;
        setTimeout(() => {document.body.removeChild(this.container);this.container=null}, 400);
    }
}

// __________ Dialog - Data presets __________
let addTask = {
    title: "Create task",
    content:[
        {
            subtitle_id: "task",
            subtitle: "Add a task",
            content: [
                {id: "title", name: "title",label:"Task Title", placeholder: "Title", type: "text", autofocus:"autofocus"},
                {id: "timePlanned", label: "Time Planned", name: "Estimated duration", type: "group",
                    content: [
                        {id: "hours", name:"hours", placeholder: "hh", type: "number", value: 0},
                        {type: "separator", value: ":"},
                        {id: "minutes", name: "minutes", placeholder: "mm", type: "number", value: 10},
                        {type: "separator", value: ":"},
                        {id: "seconds", name: "seconds", placeholder: "ss", type: "number", value: 0}
                    ],
                    formula: ([hours,minutes,seconds]) => {
                        return hours * 3600 + minutes * 60 + seconds;
                    },
                    reverseFormula: (value) => {
                        return [Math.floor(value / 3600),Math.floor((value % 3600) / 60), value % 60]
                    }
                }
            ]
        }
    ],
    buttons: [
        {type: "submit", id: "submit", value: "Add task", class: "success", callback: "submit", close: true, validate: true}
    ],
    submit: (data, id) => {
        aplicatie.tasks.createTask(data);
    }
}

let editTask = {
    title: "Task Properties",
    content:[
        {
            subtitle_id: "task",
            subtitle: "Edit task properties",
            content: [
                {id: "title", name: "title",label:"Task Title", placeholder: "Title", type: "text", autofocus:"autofocus"},
                {id: "timePlanned", label: "Time Planned", name: "Estimated duration", type: "group",
                    content: [
                        {id: "pl_hours", name:"hours", placeholder: "hh", type: "number", value: 0},
                        {type: "separator", value: ":"},
                        {id: "pl_minutes", name: "minutes", placeholder: "mm", type: "number", value: 10},
                        {type: "separator", value: ":"},
                        {id: "pl_seconds", name: "seconds", placeholder: "ss", type: "number", value: 0}
                    ],
                    formula: ([hours,minutes,seconds]) => {
                        return hours * 3600 + minutes * 60 + seconds;
                    },
                    reverseFormula: (value) => {
                        return [Math.floor(value / 3600),Math.floor((value % 3600) / 60), value % 60]
                    }
                },
                {id: "timeSpent", label: "Time Spent", name: "Worked time", type: "group",
                    content: [
                        {id: "sp_hours", name:"hours", placeholder: "hh", type: "number", value: 0},
                        {type: "separator", value: ":"},
                        {id: "sp_minutes", name: "minutes", placeholder: "mm", type: "number", value: 10},
                        {type: "separator", value: ":"},
                        {id: "sp_seconds", name: "seconds", placeholder: "ss", type: "number", value: 0}
                    ],
                    formula: ([hours,minutes,seconds]) => {
                        return hours * 3600 + minutes * 60 + seconds;
                    },
                    reverseFormula: (value) => {
                        return [Math.floor(value / 3600),Math.floor((value % 3600) / 60), value % 60]
                    }
                }
            ]
        }
    ],
    buttons: [
        {type: "submit", id:"submit", value: "Edit task", class: "info", callback: "submit"},
        {type: "button", id:"remove", value: "Remove", class:"danger", callback: (data, id) => {
            aplicatie.tasks.removeTask(id);
        }, close: true, validate: false}
    ],
    submit: (data, id) => {
        aplicatie.tasks.updateTask(id, data, ["title", "timeSpent", "timePlanned"]);
    }
}

let settings = {
    title: "Settings",
    content: [
        {
            subtitle_id: "pomodoro",
            subtitle: "Pomodoro",
            content: [
                {id: "w_duration", label: "Work period duration", placeholder: "How much work period should last", type: "number"},
                {id: "b_duration", label: "Break period duration", placeholder: "How much break period should last", type: "number"},
                {id: "fixed_nr", label: "Work for a planned time of pomodoros", type: "checkbox"},
                {id: "max_pomodoro_per_day", label: "Maximum number of pomodoros per day (-1 if none)", placeholder: "max number / -1 if no max", type: "number"}
            ]
        },
        {
            subtitle_id: "workflow",
            subtitle: "Work flow",
            content: [
                {id: "autostart_first", label: "Auto-start first task at pomodoro start", type: "checkbox"},
                {id: "autostart_next", label: "Auto-start next task when active task completed", type: "checkbox"}
            ]
        },
        {
            subtitle_id: "notifications",
            subtitle: "Desktop notifications",
            content: [
                {id: "show_not", label: "Enable desktop notifications", type: "checkbox"},
                {id: "show_not_tasktimeout", label: "Notification when task timeout", type: "checkbox"},
            ]
        },
        {
            subtitle_id: "sounds",
            subtitle: "Sound notifications",
            content: [
                {id: "sound_workbreak", label: "When finish work / break period", type: "checkbox"},
                {id: "sound_tasktimeout", label: "When task timeout", type: "checkbox"}
            ]
        },
        {
            subtitle_id: "tray",
            subtitle: "Status Icon",
            content: [
                {id: "enable_tray", label: "Enable", type: "checkbox"},
                {id: "show_time", label: "Show time in menubar (macOs)", type: "checkbox"},
                {id: "dark_icons", label: "Use dark icons (for light menubars)", type: "checkbox"}
            ]
        },
        {
            subtitle_id: "break",
            subtitle: "Break pop-up window",
            content: [
                {id: "enable_break", label: "Enable break pop-up window", type:"checkbox"},
                {id: "restrictedMode", label: "Prevent break window closing during break period. WARNING: this will make the computer unusable until break period finishes", type:"checkbox"}
            ]
        }
    ],
    buttons: [
        {type: "button", id:"requestNotificationPermission", value: "Request Notification Permission", class:"info", callback: (data, id) => {
            Notification.requestPermission();
        }, close: false, validate: false},
        {type: "button", id:"removeLocalStorage", value: "Remove local storage items", class:"danger", callback: (data, id) => {
            for (let key in localStorage) {
                localStorage.removeItem(key);
            }
        }, close: false, validate: false},
        {type: "submit", id:"submit", value: "Apply Settings", class: "success", callback: "submit"}
    ],
    submit: (data, id) => {
        Settings.set(data);
    }
}

let addNote = {
    title: "Add note",
    content: [
        {
            subtitle_id: "note",
            subtitle: "Add new note",
            content: [
                {id: "title", label: "Note title", type: "text", placeholder: "Title", autofocus:"autofocus"},
                {id: "text", label: "Note content", type: "textarea", placeholder: "Write something"}
            ]
        }
    ],
    buttons: [
        {type: "submit", id: "submit", value: "Add Note", class: "success", callback: "submit"}
    ],
    submit: (data, id) => {
        aplicatie.notes.add(data);
    }
}

let editNote = {
    title: "Edit note",
    content:[
        {
            subtitle_id: "note",
            subtitle: "Edit note",
            content: [
                {id: "title",label:"Note Title", placeholder: "Title", type: "text"},
                {id: "text", label: "Note content", type: "textarea", placeholder: "Write something", autofocus:"autofocus"}
            ]
        }
    ],
    buttons: [
        {type: "submit", id:"submit", value: "Edit note", class: "info", callback: "submit"},
        {type: "button", id:"remove", value: "Remove", class:"danger", callback: (data, id) => {
            aplicatie.notes.remove(id);
        }, close: true, validate: false}
    ],
    submit: (data, id) => {
        aplicatie.notes.edit(data, id);
    }
}

let preset = {
    title: "Demo input dialog",
    content: [
        {
            subtitle_id: "subtitle_1",
            subtitle: "First subtitle",
            content: [
                {id: "first_input", label: "Type something", type: "text", initialValue: "Please don't delete me", placeholder: "You don't have why to write something here because it's useless"},
                {id: "second_input", label: "Type something else", type: "number", initialValue: 0, placeholder: "Here you can type only numbers"},
                {id: "third_input", label: "Yes or no?", type: "checkbox", initialValue: 1}
            ]
        },
        {
            subtitle_id: "subtitle_2",
            subtitle: "Another subtitle",
            content: [
                {id: "input", label: "Idk what to put here", type:"text", placeholder: "Share your thoughts"}
            ]
        }
    ],
    buttons: [
        {type:"button", name:"Do something else", action:()=> {
            aplicatie.changeState("work");
        }},
        {type:"submit", name:"Finsh the input"}
    ]
}

