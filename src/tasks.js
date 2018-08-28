// __________ Tasks - Controller __________
class TaskController {
    constructor(initialTasks,aplicatie) {
        this.aplicatie = aplicatie;

        this.taskList = new Map();
        this.taskList.set("maxId", -1);

        this.active = null;
        this.state = "planificare";
        this.paused = true;

        aplicatie.clock.register(this);

        this.order = new TasksOrder();
        this.view = new TasksView(this);

        if(aplicatie.settings.sounds.sound_tasktimeout)
            this.audio = new Audio("res/audio/definite.mp3");
        else
            this.audio = {play: function() {return false}};
    }

    callback(e) {
        // get the task which was targeted
        let element;
        for(element = e.target; element.tagName.toLowerCase() != "html" && element.id.slice(0,4) != "task"; element = element.parentNode);
        let task = aplicatie.tasks.taskList.get(parseInt(element.id.slice(5)));

        // see which button was pressed
        let className;
        for(element = e.target; element.tagName.toLowerCase() != "html"; element = element.parentNode) {
            ["playStop","edit","remove","times","mv2b"].forEach(classa => {
                if(element.classList.contains(classa)) {
                    className = classa;
                }
            });
            if(className != undefined)
                break;
        }

        if(!className) {
            className = "times";
        }

        switch (className) {
            case "playStop":
                // pause the active task
                if(task.state == "paused" && aplicatie.tasks.active != null) {
                    aplicatie.tasks.updateTask(aplicatie.tasks.active.id, {task:{state:"paused"}}, ["state"]);
                }

                aplicatie.tasks.updateTask(task.id, {task:{state: (task.state == "running") ? "paused" : "running"}}, ["state"]);
                break;
            case "times":
                if(task.state != "done") {
                    aplicatie.tasks.updateTask(task.id, {task:{state:"done"}}, ["state"]);
                    aplicatie.tasks.order.complete(parseInt(task.id));

                    //start next task
                    if(aplicatie.settings.workflow.autostart_next && aplicatie.tasks.state == "work" && aplicatie.tasks.active == null) {
                        let nextId = aplicatie.tasks.order.next(task.id);
                        if(nextId != null) {
                            aplicatie.tasks.updateTask(nextId, {task:{state:"running"}}, ["state"]);
                        }
                    }
                } else {
                    aplicatie.tasks.updateTask(task.id, {task:{state:"paused", timeSpent:task.timeSpent, timePlanned:task.timePlanned}}, ["state", "timeSpent"]);
                    aplicatie.tasks.order.uncomplete(parseInt(task.id));
                }
                break;
            case "edit":
                aplicatie.gui.dialogs.create(editTask, {task:task.data}, task.id);
                break;
            case "remove":
                aplicatie.tasks.removeTask(task.id);
                break;
            case "mv2b":
                aplicatie.backlog.add({task:task.data});
                aplicatie.tasks.removeTask(task.id);
                break;
        }
        className = task = null;
    }

    changeState(state) {
        switch (state) {
            case "work":
                if(this.paused) {
                    this.paused = false;

                    //start first task
                    if(aplicatie.settings.workflow.autostart_first  && this.state == "planificare" && this.active == null && this.order.next(this.order[0]) != null) {
                        this.active = this.taskList.get(this.order.next(this.order[0]));
                        this.updateTask(this.active.id, {task:{state:"running"}}, ["state"]);
                    }
                }
                break;
            case "review":
                this.paused = true;

                // pause the active task
                if(this.active) {
                    this.updateTask(this.active.id, {task: {state: "paused"}}, ["state"]);
                }
                break;
        }

        this.view.changeState(state, this.state);
        this.state = state;
    }

    togglePaused() {
        this.paused = !this.paused;
    }

    createTask(data) {
        let newId = this.taskList.get("maxId");
        this.taskList.set("maxId", ++newId);
        let new_task = new Task(data, newId);

        this.taskList.set(newId, new_task);
        this.view.createTask(new_task);
        this.order.add(newId);
        
        if(this.taskList.size == 2) {
            this.view.toggleNoTasksMessage();
        }

        new_task = null;
    }

    updateTask(id, data, keys = ["title", "timePlanned", "timeSpent", "state"]) {
        if(this.taskList.has(id)) {
            let task = this.taskList.get(id);
            task.update(data, keys);
            this.view.updateTask(task, keys);

            keys.forEach(key => {
                switch (key) {
                    case "timeSpent":
                        this.timeHooks(task);
                        break;
                    case "state":
                        switch (task.state) {
                            case "paused":
                            case "done":
                                if(this.active == task) {
                                    this.active = null;
                                }
                                break;
                            case "running":
                                this.active = task;
                                break;
                        }
                        break;
                }
            })
            task = null;
        } else {
            console.warn(`No task with id ${id} found`);
        }
    }

    removeTask(id) {
        let toRemove = this.taskList.get(id);

        if(toRemove) {
            if(this.active == toRemove) {
                this.active = null;
            }
            toRemove = null;
            this.taskList.delete(id);
            this.view.removeTask(id);
            this.order.remove(parseInt(id));
            if(this.taskList.size == 1) {
                this.view.toggleNoTasksMessage();
            }
        } else {
            console.warn(`No task with id ${id} found`);
            toRemove = null;
        }
    }

    tick() {
        if (this.active) {
            this.view.updateTask(this.active, ['timeSpent']);
            this.timeHooks(this.active);
            this.active.tick();
        }
    }

    timeHooks(task) {
        let remaining = task.timePlanned - task.timeSpent;
        switch (remaining) {
            case 0:
            case -600:
                // send notification task timeout
                this.audio.play();
                if(aplicatie.settings.notifications.show_not_tasktimeout)
                    aplicatie.notifications.notify("tasktimeout", task.title);
                break;
        }
        remaining = null;
    }

    get completed() {
        let result = [];
        this.order.completed.forEach(id => {
            result.push(this.taskList.get(id).data);
        })
        return result;
    }
}

// __________ Tasks - TaskOrder __________
class TasksOrder extends Array {
    constructor() {
        super();
        this.completed = [];
    }

    add(id) {
        this.push(id);
    }

    remove(id) {
        for(let index = 0, newIndex = 0; index < this.length; index++, newIndex++) {
            if(this[index] == id) {
                index++;
            }
            this[newIndex] = this[index];
        }

        let i = this.completed.indexOf(id)
        if(i != -1) {
            this.completed.splice(i, 1);
        }

        this.length--;
    }

    set(newOrder) {
        for(let i = 0; i < this.length; i++) {
            this[i] = newOrder[i];
        }
    }

    complete(id) {
        this.completed.push(id);
    }

    uncomplete(id) {
        let i = this.completed.indexOf(id)
        if(i != -1) {
            this.completed.splice(i, 1);
        }
    }

    next(id) {
        let i_id = this.indexOf(id);
        let i = i_id + 1;
        if(this.completed.indexOf(this[i_id]) == -1)
            return this[i_id];

        for(; i < this.length && this.completed.indexOf(this[i]) != -1; i++);
        if(this.length == i)
            for(i = 0; i < i_id && this.completed.indexOf(this[i]) != -1; i++);

        if(i == this.indexOf(id))
            return null;
        else
            return this[i];
    }
}

// __________ Tasks - Task item __________
class Task {
    constructor(data, id) {
        this.title = data.task.title;
        this.timePlanned = parseInt(data.task.timePlanned);
        this.timeSpent = 0;
        this.id = id;
        this.state = "paused";
    }

    tick() {
        this.timeSpent++;
    }

    update(data, keys) {
        keys.forEach((key) => {
            if(key == "timeSpent" || key == "timePlanned") {
                this[key] = parseInt(data.task[key]);
            } else {
                this[key] = data.task[key];
            }
        });
    }
    
    get data() {
        return {title:this.title, timePlanned: this.timePlanned, timeSpent: this.timeSpent};
    }
}

// __________ Tasks - View __________
class TasksView {
    constructor(controller) {
        this.controller = controller;
        this.parent = document.getElementById("tasks");

        this.parent.addEventListener("click", controller.callback);
        this.parent.addEventListener('dragstart', Draggable.dragStart, false);
        this.parent.addEventListener('dragover', Draggable.dragOver, false);
        this.parent.addEventListener('drop', Draggable.dragDrop, false);
        this.parent.addEventListener('dragend', Draggable.dragEnd, false);
    }

    changeState(state, oldState) {
        this.parent.classList.toggle(oldState);
        this.parent.classList.toggle(state);

        // move completed to bottom
        if(state == "review") {
            let last = document.getElementById(`task_${this.controller.order[this.controller.order.length - 1]}`);
            this.controller.order.completed.forEach((id) => {
                this.parent.insertBefore(document.getElementById(`task_${id}`), last.nextSibling);
            })
        }

        // reorder tasks
        if(state == "work" && oldState == "review") {
            let i = 0;
            this.parent.childNodes.forEach((node) => {
                if(node.id.slice(5) != this.controller.order[i]) {
                    this.parent.insertBefore(document.getElementById(`task_${this.controller.order[i]}`), node);
                }
                i++;
            })
        }
    }

    toggleNoTasksMessage() {
        document.querySelector("div.tasks.card span.information").classList.toggle("hidden");
    }

    createTask(task) {
        // create the task element
        let li = document.createElement("li");
        li.setAttribute("id", `task_${task.id}`);
        li.setAttribute("draggable", "true");

        //- Play stop button
        let playStop = document.createElement("div");
        playStop.className = "button playStop";

        let icon = document.createElement("i");
        icon.className = "fas fa-play playStop";

        playStop.appendChild(icon);
        li.appendChild(playStop);

        //- Title
        let title = document.createElement("span");
        title.classList.add("title");
        title.innerText = task.title;
        li.appendChild(title);

        //- Time
        let time = document.createElement("span");
        time.classList.add("times");
        time.innerText = DataFormat.time(task.timePlanned);
        li.appendChild(time);

        //- Edit Button
        let edit = document.createElement("div");
        edit.className = "button edit";

        icon = document.createElement("i");
        icon.className = "fas fa-pencil-alt";

        edit.appendChild(icon);
        li.appendChild(edit);

        //- Move to backlog
        let mv2backlog = document.createElement("div");
        mv2backlog.className = "button mv2b";

        icon = document.createElement("i");
        icon.className = "fas fa-angle-right";

        mv2backlog.appendChild(icon);
        li.appendChild(mv2backlog);

        //- Remove button
        let remove = document.createElement("span");
        remove.className = "remove";
        remove.innerText = "\u00D7";
        li.appendChild(remove);

        //- Timer animation
        let animation = document.createElement("div");
        animation.className = "animation";
        li.appendChild(animation);

        this.parent.appendChild(li);

        li = playStop = icon = title = time = edit = remove = animation = null;
    }

    updateTask(task, keys) {
        let selector = `li#task_${task.id} `;
        keys.forEach((key) => {
            switch (key) {
                case "title":
                    document.querySelector(selector + ".title").innerText = task.title;
                    break;
                case "timePlanned":
                case "timeSpent":
                    document.querySelector(selector + ".times").innerText = DataFormat.time(Math.abs(task.timePlanned-task.timeSpent));
                    if(task.timePlanned - task.timeSpent <= 0) {
                        document.querySelector(selector).classList.add("overtime");
                    } else {
                        document.querySelector(selector + ".animation").style.right = `${(1- (task.timeSpent + 1) / task.timePlanned) *100}%`;
                        if(task.timeSpent == 0 && task.state != "running") {
                            document.querySelector(selector + ".animation").style.right = "100%";
                        }
                        document.querySelector(selector).classList.remove("overtime");
                    }
                    break;
                case "state":
                    //document.querySelector(selector).className = [""];
                    document.querySelector(selector).classList.remove("checked");
                    document.querySelector(selector).classList.remove("active");
                    switch (task.state) {
                        case "running":
                            document.querySelector(selector + "i.playStop").className = "fas fa-pause playStop";
                            document.querySelector(selector).classList.add("active");
                            break;
                        case "paused":
                            document.querySelector(selector + "i.playStop").className = "fas fa-play playStop";
                            break;
                        case "done":
                            document.querySelector(selector).classList.toggle("checked");
                            document.querySelector(selector + ".times").innerText = DataFormat.time(task.timeSpent);
                            break;
                    }
                    break;
            }
        })
        selector = null;
    }
    
    removeTask(id) {
        this.parent.removeChild(document.getElementById(`task_${id}`));
    }
}
