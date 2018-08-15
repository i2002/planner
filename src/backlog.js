// __________ Backlog - Controller __________
class Backlog {
    constructor(data) {
        this.list = new Map();
        this.list.set("maxId", -1);

        this.order = [];
        this.view = new BacklogView(this);

        if (data) {
            data.forEach(item => this.add(item));
        }
    }

    // Callbacks
    // - for item
    callback(e) {
        let element;
        for(element = e.target; element.tagName != "html" && element.id.slice(0,7) != "backlog"; element = element.parentNode);
        let item = aplicatie.backlog.list.get(parseInt(element.id.slice(8)));

        let className;
        for(element = e.target; element.tagName.toLowerCase() != "html"; element = element.parentNode) {
            ["moveBacklog","remove"].forEach(classa => {
                if(element.classList.contains(classa)) {
                    className = classa;
                }
            });
            if(className != undefined)
                break;
        }

        switch(className) {
            case "moveBacklog":
                aplicatie.backlog.move(item.id);
                break;
            case "remove":
                aplicatie.backlog.remove(item.id);
        }
    }

    // - for all items
    moveAll() {
        while(0 < aplicatie.backlog.order.length) {
            aplicatie.backlog.move(aplicatie.backlog.order[0]);
        }
    }

    dismissAll() {
        while(0 < aplicatie.backlog.order.length) {
            aplicatie.backlog.remove(aplicatie.backlog.order[0]);
        }
    }

    getAll() {
        let result = [];
        this.order.forEach(id => result.push({task: this.list.get(id)}));
        return result;
    }

    // Item operations
    add(data) {
        let newId = this.list.get("maxId");
        this.list.set("maxId", ++newId);
        let new_item = new BacklogItem(data, newId);

        this.list.set(newId, new_item);
        this.view.create(new_item);
        this.order.push(newId);

        if(this.list.size == 2) {
            this.view.toggleEmptyMessage();
        }
    }

    move(id) {
        aplicatie.tasks.createTask(this.list.get(id).data);
        this.remove(id);
    }

    remove(id) {
        let toRemove = this.list.get(id);

        if(toRemove) {
            toRemove = null;
            this.list.delete(id);
            this.view.remove(id);
            let i = this.order.indexOf(id)
            if(i != -1) {
                this.order.splice(i, 1);
            }
        }

        if(this.list.size == 1) {
            this.view.toggleEmptyMessage();
        }
    }
}

// __________ Backlog - Item object __________
class BacklogItem {
    constructor(data, id) {
        this.title = data.task.title;
        this.timePlanned = parseInt(data.task.timePlanned);
        this.timeSpent = parseInt(data.task.timeSpent);
        this.id = id;
    }

    get data() {
        return {task: {title:this.title, timePlanned: this.timePlanned, timeSpent:this.timeSpent}};
    }
}

// __________ Backlog - View __________
class BacklogView {
    constructor(controller) {
        //this.parent = document.getElementById("backlog");
        document.getElementById("backlog").addEventListener("click", controller.callback);
        document.getElementById("backlog").addEventListener('dragstart', Draggable.dragStart, false);
        document.getElementById("backlog").addEventListener('dragover', Draggable.dragOver, false);
        document.getElementById("backlog").addEventListener('drop', Draggable.dragDrop, false);
        document.getElementById("backlog").addEventListener('dragend', Draggable.dragEnd, false);

        document.querySelector(".card.backlog .dismissAll").addEventListener("click", controller.dismissAll);
        document.querySelector(".card.backlog .moveAll").addEventListener("click", controller.moveAll);
    }

    create(item) {
        let li = document.createElement("li");
        li.setAttribute("id", `backlog_${item.id}`);
        li.setAttribute("draggable", "true");

        //- Move to task list button
        let move = document.createElement("div");
        move.className = "button moveBacklog";

        let icon = document.createElement("i");
        icon.className = "fas fa-angle-left moveBacklog";

        move.appendChild(icon);
        li.appendChild(move);

        //- Title
        let title = document.createElement("span");
        title.classList.add("title");
        title.innerText = item.title;
        li.appendChild(title);

        //- Time
        let time = document.createElement("span");
        time.classList.add("time");
        time.innerText = (item.timePlanned > item.timeSpent) ? DataFormat.time(item.timePlanned - item.timeSpent) : DataFormat.time(item.timePlanned);
        li.appendChild(time);

        //- Remove Button
        let remove = document.createElement("span");
        remove.classList.add("remove");
        remove.innerText = "\u00D7";
        li.appendChild(remove);

        document.getElementById("backlog").appendChild(li);

        li = move = icon = title = time = remove = null;
    }

    remove(id) {
        document.getElementById("backlog").removeChild(document.getElementById(`backlog_${id}`));
    }

    toggleEmptyMessage() {
        document.querySelector(".backlog .information").classList.toggle("hidden");
    }
}